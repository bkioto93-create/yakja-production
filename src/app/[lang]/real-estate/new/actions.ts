// مسیر فایل: src/app/[lang]/real-estate/new/actions.ts
// تسک ۴/۵ فاز ۰۵ — دو اکشن جدا برای آپلود امن تصویر + ثبت نهایی آگهی ملک، دقیقاً هم‌الگو با
// src/app/[lang]/listings/new/actions.ts (فاز ۰۲، تسک ۴/۵). دلیل دو مرحله‌ای بودن دقیقاً همان
// دلیل ماژول کالاست: auth.uid() در معماری نشست سفارشی این پروژه همیشه null است (بند ۸.۴ سند
// راهبردی)، پس مرورگر با Anon Key هرگز نمی‌تواند مستقیم در باکت real-estate-images (ساخته‌شده
// در فاز ۰۰) بنویسد. این سرور (با Service Role که کاربر واقعی را از روی کوکی نشست می‌شناسد) چند
// «آدرس آپلود امضاشده‌ی موقت» صادر می‌کند؛ مرورگر مستقیماً و بدون عبور از سرور Next.js تصویر
// فشرده‌شده را به همان آدرس می‌فرستد.
//
// به‌روزرسانی تسک ۵ (نسبت به تسک ۴): همان‌طور که در کامنت نسخه‌ی قبلی این فایل پیش‌بینی شده بود،
// حالا که فشرده‌سازی سمت کلاینت (src/lib/realEstate/imageCompression.ts) همیشه خروجی JPEG با
// کیفیت پویا تولید می‌کند، دیگر نیازی به دریافت/نگاشت نوع MIME واقعی فایل مرورگر نیست.
// createSignedUploadSlotsAction به همان الگوی ساده‌ی ماژول کالا (تسک ۵ فاز ۰۲) برگشت: فقط تعداد
// عکس را می‌گیرد و برای هر اسلات مستقیماً پسوند ثابت .jpg می‌سازد. این تغییر غیرشکننده است و به
// هیچ مهاجرت داده‌ای نیاز ندارد (نه ستون‌های جدول real_estate و نه محتوای باکت تغییر می‌کند).
//
// نکته‌ی مهم طراحی (طبق کامنت src/lib/realEstate/dealTypes.ts، تسک ۲ همین فاز): ستون deal_type
// عمداً مستقل از property_type نگه داشته شده. مرحله‌ی ۱ فرم (NewRealEstateWizard.tsx) برای انواع
// «فروش خانه»/«اجاره خانه»/«فروش زمین»/«باغ»، نوع معامله را خودکار از روی نوع ملک تعیین می‌کند؛
// فقط برای «مغازه»/«سوله»/«سایر» (که هم فروشی و هم اجاره‌ای معنا دارند) از کاربر جداگانه پرسیده
// می‌شود. این اکشن، صرف‌نظر از این‌که مقدار در کلاینت چطور به دست آمده، هر دو مقدار را مستقل و طبق
// CHECK constraint دیتابیس (تسک ۲) اعتبارسنجی می‌کند — دفاع در عمق واقعی سمت سرور.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { toAsciiDigits } from "@/lib/marketplace/numbers";
import { isValidPropertyType } from "@/lib/realEstate/propertyTypes";
import { isValidDealType } from "@/lib/realEstate/dealTypes";
import { isValidProvince } from "@/lib/provinces";

const REAL_ESTATE_BUCKET = "real-estate-images";
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

export async function createRealEstateListingAction(input: {
  propertyType: string;
  dealType: string;
  province: string;
  price: string;
  address: string;
  description: string;
  imagePaths: string[];
  latitude?: number | null;
  longitude?: number | null;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "unauthenticated" };

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
    location: locationValue,
    status: "pending",
  });

  if (insertError) {
    // پاک‌سازی تصاویر یتیم در صورت شکست ثبت آگهی (خطای پاک‌سازی نادیده گرفته می‌شود؛ اولویت با
    // پیام خطای اصلی است) — دقیقاً هم‌الگو با createListingAction ماژول کالا.
    try {
      await supabaseAdminClient.storage.from(REAL_ESTATE_BUCKET).remove(input.imagePaths);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false as const, error: "dbError" };
  }

  return { success: true as const };
}