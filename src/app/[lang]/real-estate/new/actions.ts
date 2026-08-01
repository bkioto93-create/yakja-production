// مسیر فایل: src/app/[lang]/real-estate/new/actions.ts
// تسک ۴/۵ فاز ۰۵ — دو اکشن جدا برای آپلود امن تصویر + ثبت نهایی آگهی ملک، دقیقاً هم‌الگو با
// src/app/[lang]/listings/new/actions.ts (فاز ۰۲، تسک ۴/۵). دلیل دو مرحله‌ای بودن دقیقاً همان
// دلیل ماژول کالاست: auth.uid() در معماری نشست سفارشی این پروژه همیشه null است (بند ۸.۴ سند
// راهبردی)، پس مرورگر با Anon Key هرگز نمی‌تواند مستقیم در باکت real-estate-images بنویسد.
//
// نکته‌ی مهم طراحی (طبق کامنت src/lib/realEstate/dealTypes.ts، تسک ۲ همین فاز): ستون deal_type
// عمداً مستقل از property_type نگه داشته شده؛ این اکشن هر دو مقدار را مستقل و طبق CHECK
// constraint دیتابیس اعتبارسنجی می‌کند — دفاع در عمق واقعی سمت سرور.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):**
//   ۱) createSignedVideoUploadSlotAction اضافه شد — دقیقاً هم‌الگو با نسخه‌ی مشابهش در
//      listings/new/actions.ts، گیت‌شده سمت سرور با isUserVip.
//   ۲) createRealEstateListingAction قبل از insert، سقف روزانه‌ی ۲ آگهی رایگان (کالا+ملک با هم،
//      طبق src/lib/vip/dailyPostLimit.ts) را هم بررسی می‌کند.
//   ۳) ورودی videoPath (اختیاری) پذیرفته و در ستون تازه‌ی real_estate.video_path ذخیره می‌شود.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { toAsciiDigits } from "@/lib/marketplace/numbers";
import { isValidPropertyType } from "@/lib/realEstate/propertyTypes";
import { isValidDealType } from "@/lib/realEstate/dealTypes";
import { isValidProvince } from "@/lib/provinces";
import { isUserVip } from "@/lib/vip/vipStatus";
import { canUserPostToday } from "@/lib/vip/dailyPostLimit";

const REAL_ESTATE_BUCKET = "real-estate-images";
const REAL_ESTATE_VIDEOS_BUCKET = "real-estate-videos";
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
    // قرارداد مسیر فایل طبق فاز ۰۰ (دقیقاً هم‌الگو با ماژول کالا): {owner_id}/{filename} — سرور
    // خودش مسیر را می‌سازد، پس کلاینت هیچ‌وقت نمی‌تواند مسیری بیرون از پوشه‌ی خودش تولید کند.
    const path = `${user.id}/${Date.now()}_${i}.jpg`;
    const { data, error } = await supabaseAdminClient.storage
      .from(REAL_ESTATE_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { success: false, error: "uploadFailed" };
    }
    slots.push({ path: data.path, token: data.token });
  }

  return { success: true, slots };
}

// فاز ۱۱ — یک ویدئوی تکی، فقط برای کاربر VIP؛ گیت‌کردن واقعی سمت سرور.
export async function createSignedVideoUploadSlotAction(): Promise<
  { success: true; slot: SignedUploadSlot } | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };
  if (!isUserVip(user.vipExpiresAt)) return { success: false, error: "notVip" };

  const path = `${user.id}/${Date.now()}.mp4`;
  const { data, error } = await supabaseAdminClient.storage
    .from(REAL_ESTATE_VIDEOS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

export async function createRealEstateListingAction(input: {
  propertyType: string;
  dealType: string;
  province: string;
  price: string;
  address: string;
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

  if (!isValidPropertyType(input.propertyType)) {
    return { success: false as const, error: "invalidPropertyType" };
  }

  if (!isValidDealType(input.dealType)) {
    return { success: false as const, error: "invalidDealType" };
  }

  // فاز ۱۰ — درخواست مستقیم کارفرما: هر آگهی ملک باید دقیقاً به یک ولایت مشخص تعلق داشته باشد.
  if (!isValidProvince(input.province)) {
    return { success: false as const, error: "invalidProvince" };
  }

  const priceNumber = Number(toAsciiDigits(input.price));
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return { success: false as const, error: "invalidPrice" };
  }

  const address = input.address.trim();
  if (!address) return { success: false as const, error: "invalidAddress" };

  if (input.imagePaths.length < MIN_IMAGES || input.imagePaths.length > MAX_IMAGES) {
    return { success: false as const, error: "invalidImageCount" };
  }

  // دفاع در عمق: هیچ مسیر تصویری نباید بیرون از پوشه‌ی خودِ همین کاربر باشد.
  const ownsAllPaths = input.imagePaths.every((p) => p.startsWith(`${user.id}/`));
  if (!ownsAllPaths) return { success: false as const, error: "invalidImageData" };

  // فاز ۱۱ — گیت‌کردن واقعی ویدئو، دوباره سمت سرور.
  let videoPath: string | null = null;
  if (input.videoPath) {
    if (!isVip) return { success: false as const, error: "notVip" };
    if (!input.videoPath.startsWith(`${user.id}/`)) {
      return { success: false as const, error: "invalidVideoData" };
    }
    videoPath = input.videoPath;
  }

  const description = input.description.trim() || null;

  // ساخت مقدار geography از مختصات مرورگر (در صورت اجازه‌ی کاربر)؛ در غیر این صورت null می‌ماند —
  // دقیقاً همان رفتاری که ستون location در تسک ۲ همین فاز برایش طراحی شده بود.
  const locationValue =
    typeof input.latitude === "number" && typeof input.longitude === "number"
      ? `SRID=4326;POINT(${input.longitude} ${input.latitude})`
      : null;

  const { error: insertError } = await supabaseAdminClient.from("real_estate").insert({
    owner_id: user.id,
    property_type: input.propertyType,
    deal_type: input.dealType,
    province: input.province,
    price: priceNumber,
    address,
    description,
    images: input.imagePaths,
    video_path: videoPath,
    location: locationValue,
    status: "pending",
  });

  if (insertError) {
    // پاک‌سازی تصاویر/ویدئوی یتیم در صورت شکست ثبت آگهی — دقیقاً هم‌الگو با createListingAction.
    try {
      await supabaseAdminClient.storage.from(REAL_ESTATE_BUCKET).remove(input.imagePaths);
      if (videoPath) {
        await supabaseAdminClient.storage.from(REAL_ESTATE_VIDEOS_BUCKET).remove([videoPath]);
      }
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false as const, error: "dbError" };
  }

  return { success: true as const };
}