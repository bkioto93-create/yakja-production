// مسیر فایل: src/app/[lang]/listings/new/actions.ts
// تسک ۴/۵ فاز ۰۲ — دو اکشن جدا برای آپلود امن تصویر + ثبت نهایی آگهی.
// چرا دو مرحله؟ چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null است (بند ۸.۴ سند
// راهبردی)، پس مرورگر با Anon Key هرگز نمی‌تواند مستقیم در باکت listings-images بنویسد. راه‌حل:
// این سرور (با Service Role که کاربر واقعی را از روی کوکی نشست می‌شناسد) چند «آدرس آپلود
// امضاشده‌ی موقت» صادر می‌کند؛ مرورگر مستقیماً و بدون عبور از سرور Next.js تصویر فشرده‌شده را به
// همان آدرس می‌فرستد (uploadToSignedUrl) — سبک‌تر برای اینترنت ۲G/۳G و بدون نیاز به دستکاری سقف
// حجم پیش‌فرض Server Action در Next.js. در پایان فقط مسیر فایل‌ها (رشته، نه بایت تصویر) به اکشن
// دوم فرستاده می‌شود.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):**
//   ۱) createSignedVideoUploadSlotAction اضافه شد — دقیقاً هم‌الگو با createSignedUploadSlotsAction
//      اما برای باکت تازه‌ی listings-videos، و با یک بررسی اضافه که خودِ Icons.tsx UI نمی‌تواند
//      جایگزینش شود: سمت سرور دوباره بررسی می‌کند کاربر واقعاً VIP فعال است (نه فقط این‌که
//      کلاینت دکمه‌ی آپلود را نشانش داده) — این همان «گیت‌کردن واقعی»ای است که پرامپت VIP روی آن
//      تاکید صریح داشت؛ صرفاً مخفی‌کردن دکمه در UI برای امنیت کافی نیست.
//   ۲) createListingAction قبل از insert، سقف روزانه‌ی ۲ آگهی رایگان را هم بررسی می‌کند
//      (src/lib/vip/dailyPostLimit.ts) — دوباره، سمت سرور، نه فقط سمت کلاینت.
//   ۳) ورودی videoPath (اختیاری) پذیرفته و در ستون تازه‌ی listings.video_path ذخیره می‌شود؛ اگر
//      کاربر VIP نباشد ولی videoPath فرستاده باشد (تلاش برای دور زدن UI)، درخواست رد می‌شود.
//
// **به‌روزرسانی (رفع باگ «ویدئو فشرده نمی‌شد»):** createSignedVideoUploadSlotAction حالا یک
// mimeType هم می‌پذیرد — چون کلاینت از این پس واقعاً ویدئو را با موتور مشترک
// src/lib/media/videoCompression.ts فشرده می‌کند، و بسته به مرورگر کاربر خروجی گاهی mp4 و گاهی
// webm است (رجوع کنید به یادداشت همان فایل)؛ پسوند فایل باید با محتوای واقعی هماهنگ باشد، نه
// همیشه فرضِ ثابتِ mp4.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeAfghanPhone } from "@/lib/phone";
import { toAsciiDigits } from "@/lib/marketplace/numbers";
import { isValidListingCategory } from "@/lib/marketplace/categories";
import { isValidProvince } from "@/lib/provinces";
import { isUserVip } from "@/lib/vip/vipStatus";
import { canUserPostToday } from "@/lib/vip/dailyPostLimit";

const LISTINGS_BUCKET = "listings-images";
const LISTINGS_VIDEOS_BUCKET = "listings-videos";
const MIN_IMAGES = 1;
const MAX_IMAGES = 5;

export type SignedUploadSlot = { path: string; token: string };

export async function createSignedUploadSlotsAction(
  count: number
): Promise<{ success: true; slots: SignedUploadSlot[] } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (!Number.isInteger(count) || count < MIN_IMAGES || count > MAX_IMAGES) {
    return { success: false, error: "invalidImageCount" };
  }

  const slots: SignedUploadSlot[] = [];
  for (let i = 0; i < count; i++) {
    // قرارداد مسیر فایل طبق فاز ۰۰: {owner_id}/{filename} — این‌جا سرور خودش مسیر را می‌سازد،
    // پس کلاینت هیچ‌وقت نمی‌تواند مسیری بیرون از پوشه‌ی خودش تولید کند.
    const path = `${user.id}/${Date.now()}_${i}.jpg`;
    const { data, error } = await supabaseAdminClient.storage
      .from(LISTINGS_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { success: false, error: "uploadFailed" };
    }
    slots.push({ path: data.path, token: data.token });
  }

  return { success: true, slots };
}

// پسوند فایل مناسب را از روی mimeType واقعیِ خروجیِ فشرده‌سازی تعیین می‌کند — دقیقاً هم‌الگو با
// resolveFileExtension در src/app/[lang]/profile/storyActions.ts.
function resolveVideoExtension(mimeType: string): string {
  if (mimeType.startsWith("video/mp4")) return "mp4";
  return "webm";
}

// فاز ۱۱ — یک ویدئوی تکی (طبق تصمیم پذیرفته‌شده‌ی سوال باز ۲ پرامپت VIP)، فقط برای کاربر VIP.
export async function createSignedVideoUploadSlotAction(
  mimeType: string
): Promise<{ success: true; slot: SignedUploadSlot } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  // گیت‌کردن واقعی سمت سرور — نه فقط پنهان‌کردن دکمه در UI.
  if (!isUserVip(user.vipExpiresAt)) {
    return { success: false, error: "notVip" };
  }

  const extension = resolveVideoExtension(mimeType);
  const path = `${user.id}/${Date.now()}.${extension}`;
  const { data, error } = await supabaseAdminClient.storage
    .from(LISTINGS_VIDEOS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

export async function createListingAction(input: {
  category: string;
  province: string;
  title: string;
  price: string;
  address: string;
  contactPhone: string;
  description: string;
  imagePaths: string[];
  videoPath?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "unauthenticated" };

  const isVip = isUserVip(user.vipExpiresAt);

  // فاز ۱۱ — سقف روزانه‌ی ۲ آگهی رایگان (کالا+ملک با هم)؛ کاربر VIP همیشه مجاز است.
  const { allowed } = await canUserPostToday({ userId: user.id, isVip });
  if (!allowed) {
    return { success: false as const, error: "dailyLimitReached" };
  }

  if (!isValidListingCategory(input.category)) {
    return { success: false as const, error: "invalidCategory" };
  }

  // فاز ۱۰ — درخواست مستقیم کارفرما: هر آگهی باید دقیقاً به یک ولایت مشخص تعلق داشته باشد (بر
  // خلاف فیلتر بازدیدکننده که می‌تواند «همه‌ی افغانستان» هم باشد).
  if (!isValidProvince(input.province)) {
    return { success: false as const, error: "invalidProvince" };
  }

  const title = input.title.trim();
  if (!title) return { success: false as const, error: "invalidTitle" };

  const priceNumber = Number(toAsciiDigits(input.price));
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return { success: false as const, error: "invalidPrice" };
  }

  const address = input.address.trim();
  if (!address) return { success: false as const, error: "invalidAddress" };

  const contactPhone = normalizeAfghanPhone(toAsciiDigits(input.contactPhone));
  if (!contactPhone) return { success: false as const, error: "invalidPhone" };

  if (input.imagePaths.length < MIN_IMAGES || input.imagePaths.length > MAX_IMAGES) {
    return { success: false as const, error: "invalidImageCount" };
  }

  // دفاع در عمق: هیچ مسیر تصویری نباید بیرون از پوشه‌ی خودِ همین کاربر باشد.
  const ownsAllPaths = input.imagePaths.every((p) => p.startsWith(`${user.id}/`));
  if (!ownsAllPaths) return { success: false as const, error: "invalidImageData" };

  // فاز ۱۱ — گیت‌کردن واقعی ویدئو، دوباره سمت سرور: حتی اگر کاربر با دستکاری مستقیم درخواست
  // (بدون عبور از UI) یک videoPath بفرستد، اگر VIP نباشد یا مسیر متعلق به خودش نباشد، رد می‌شود.
  let videoPath: string | null = null;
  if (input.videoPath) {
    if (!isVip) return { success: false as const, error: "notVip" };
    if (!input.videoPath.startsWith(`${user.id}/`)) {
      return { success: false as const, error: "invalidVideoData" };
    }
    videoPath = input.videoPath;
  }

  const description = input.description.trim() || null;

  // ساخت مقدار geography از مختصات مرورگر (در صورت اجازه‌ی کاربر)؛ در غیر این صورت null
  // می‌ماند — دقیقاً همان رفتاری که ستون location در تسک ۲ برایش طراحی شده بود.
  const locationValue =
    typeof input.latitude === "number" && typeof input.longitude === "number"
      ? `SRID=4326;POINT(${input.longitude} ${input.latitude})`
      : null;

  const { error: insertError } = await supabaseAdminClient.from("listings").insert({
    owner_id: user.id,
    category: input.category,
    province: input.province,
    title,
    price: priceNumber,
    address,
    contact_phone: contactPhone,
    description,
    images: input.imagePaths,
    video_path: videoPath,
    location: locationValue,
    status: "pending",
  });

  if (insertError) {
    // پاک‌سازی تصاویر/ویدئوی یتیم در صورت شکست ثبت آگهی (خطای پاک‌سازی نادیده گرفته می‌شود؛
    // اولویت با پیام خطای اصلی است)
    try {
      await supabaseAdminClient.storage.from(LISTINGS_BUCKET).remove(input.imagePaths);
      if (videoPath) {
        await supabaseAdminClient.storage.from(LISTINGS_VIDEOS_BUCKET).remove([videoPath]);
      }
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false as const, error: "dbError" };
  }

  return { success: true as const };
}