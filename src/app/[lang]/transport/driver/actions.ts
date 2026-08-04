// مسیر فایل: src/app/[lang]/transport/driver/actions.ts
// تسک ۴ فاز ۰۳ — اکشن ثبت/ویرایش پروفایل راننده. دقیقاً هم‌الگو با
// src/app/[lang]/listings/new/actions.ts (فاز ۰۲، تسک ۴/۵): تمام اعتبارسنجی و نوشتن سمت سرور با
// supabaseAdminClient انجام می‌شود، چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null
// است (بند ۸.۴ سند راهبردی) و Policyهای RLS جدول drivers صرفاً دفاع‌در-عمق‌اند.
// عملیات saveDriverProfileAction یک upsert واحد است: اگر کاربر از قبل پروفایل راننده دارد، همان
// ردیف به‌روزرسانی می‌شود؛ در غیر این صورت ردیف جدید ساخته می‌شود.
//
// **به‌روزرسانی (بازطراحی عکس‌ها — درخواست صریح کارفرما):** سیستم قدیمی «حداکثر ۵ عکس در یک
// آرایه‌ی بی‌معنا» با دو اسلات معنادار جایگزین شد:
//   ۱) عکس خودِ راننده (personalPhotoPath) — الزامی؛ بدون آن saveDriverProfileAction رد می‌شود.
//   ۲) عکس وسیله‌ی نقلیه (vehiclePhotoPath) — اختیاری.
// createDriverSignedUploadSlotsAction (جمع، بر اساس تعداد) با createDriverPhotoUploadSlotAction
// (یکی، بر اساس نوع عکس) جایگزین شد — چون دیگر «چند عکس یکسان» نداریم، هر اسلات یک هویت مشخص
// دارد؛ مسیر فایل هم شامل همان نوع می‌شود (مثلاً owner-id/personal_...jpg) تا در صورت بازرسی
// مستقیم باکت هم بلافاصله معلوم باشد این فایل مربوط به کدام اسلات است.
//
// **اصلاحیه پروداکشن**: تابع قدیمی createDriverSignedUploadSlotsAction مجدداً برای پشتیبانی و
// جلوگیری از شکستن بیلد Vercel در لایه API موبایل (mobile/v1/.../upload-slots) اضافه شد.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeAfghanPhone } from "@/lib/phone";
import { toAsciiDigits } from "@/lib/marketplace/numbers";
import { isValidVehicleType } from "@/lib/transport/vehicleTypes";
import { isValidProvince } from "@/lib/provinces";
import { isUserVip } from "@/lib/vip/vipStatus";

const DRIVERS_BUCKET = "drivers-images";
const DRIVERS_VIDEOS_BUCKET = "drivers-videos";

export type SignedUploadSlot = { path: string; token: string };
export type DriverPhotoType = "personal" | "vehicle";

// صدور یک آدرس آپلود امضاشده برای دقیقاً یک عکس (نه چند تا) — چون هر اسلات (خودِ راننده/وسیله)
// معنای مشخصی دارد، این تابع نوع عکس را می‌گیرد و مسیر فایل را متناسب با همان نوع می‌سازد.
export async function createDriverPhotoUploadSlotAction(
  photoType: DriverPhotoType
): Promise<{ success: true; slot: SignedUploadSlot } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (photoType !== "personal" && photoType !== "vehicle") {
    return { success: false, error: "invalidPhotoType" };
  }

  // قرارداد مسیر فایل طبق فاز ۰۰: {owner_id}/{filename} — سرور خودش مسیر را می‌سازد، پس
  // کلاینت هیچ‌وقت نمی‌تواند مسیری بیرون از پوشه‌ی خودش تولید کند.
  const path = `${user.id}/${photoType}_${Date.now()}.jpg`;
  const { data, error } = await supabaseAdminClient.storage
    .from(DRIVERS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

// لایه سازگاری برای لایه API موبایل (برای جلوگیری از خطای Build در Vercel)
// این تابع دقیقاً عملکرد قدیمی مبتنی بر آرایه‌ای از عکس‌ها را برای اپلیکیشن موبایل فراهم می‌کند.
export async function createDriverSignedUploadSlotsAction(
  count: number
): Promise<{ success: true; slots: SignedUploadSlot[] } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (!Number.isInteger(count) || count < 0 || count > 5) {
    return { success: false, error: "invalidImageCount" };
  }

  const slots: SignedUploadSlot[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const path = `${user.id}/${now}_${i}.jpg`;
    const { data, error } = await supabaseAdminClient.storage
      .from(DRIVERS_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { success: false, error: "uploadFailed" };
    }
    slots.push({ path: data.path, token: data.token });
  }

  return { success: true, slots };
}

// فاز ۱۱ — یک ویدئوی تکی، فقط برای کاربر VIP؛ گیت‌کردن واقعی سمت سرور.
export async function createDriverSignedVideoUploadSlotAction(): Promise<
  { success: true; slot: SignedUploadSlot } | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };
  if (!isUserVip(user.vipExpiresAt)) return { success: false, error: "notVip" };

  const path = `${user.id}/${Date.now()}.mp4`;
  const { data, error } = await supabaseAdminClient.storage
    .from(DRIVERS_VIDEOS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

export async function saveDriverProfileAction(input: {
  vehicleType: string;
  province: string;
  vehicleDetails: string;
  contactPhone: string;
  personalPhotoPath: string;
  vehiclePhotoPath: string | null;
  videoPath?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const isVip = isUserVip(user.vipExpiresAt);

  if (!isValidVehicleType(input.vehicleType)) {
    return { success: false, error: "invalidVehicleType" };
  }

  // فاز ۱۰ — درخواست مستقیم کارفرما: هر راننده باید دقیقاً به یک ولایت مشخص تعلق داشته باشد.
  if (!isValidProvince(input.province)) {
    return { success: false, error: "invalidProvince" };
  }

  const contactPhone = normalizeAfghanPhone(toAsciiDigits(input.contactPhone));
  if (!contactPhone) return { success: false, error: "invalidPhone" };

  // عکس خودِ راننده الزامی است — طبق درخواست صریح کارفرما («یه عکس از خودش جداگانه که حتمی باید
  // بزاره»). دفاع در عمق: هم خالی‌نبودن، هم مالکیتِ مسیر (باید داخل پوشه‌ی خودِ همین کاربر باشد).
  if (!input.personalPhotoPath || !input.personalPhotoPath.startsWith(`${user.id}/`)) {
    return { success: false, error: "personalPhotoRequired" };
  }

  // عکس وسیله اختیاری است؛ اگر فرستاده شده، همان بررسی مالکیت روی آن هم اعمال می‌شود.
  if (input.vehiclePhotoPath && !input.vehiclePhotoPath.startsWith(`${user.id}/`)) {
    return { success: false, error: "invalidImageData" };
  }

  // فاز ۱۱ — گیت‌کردن واقعی ویدئو، دوباره سمت سرور.
  let videoPath: string | null = null;
  if (input.videoPath) {
    if (!isVip) return { success: false, error: "notVip" };
    if (!input.videoPath.startsWith(`${user.id}/`)) return { success: false, error: "invalidVideoData" };
    videoPath = input.videoPath;
  }

  const vehicleDetails = input.vehicleDetails.trim() || null;

  // نظافت فایل یتیم: پیش از upsert، مقادیر فعلی (پیش از این ذخیره) خوانده می‌شوند تا بعداً
  // بتوان مسیرهای جایگزین‌شده/حذف‌شده توسط کاربر را تشخیص داد و از Storage هم واقعاً پاک کرد.
  const { data: existingRow } = await supabaseAdminClient
    .from("drivers")
    .select("personal_photo_path, vehicle_photo_path, video_path")
    .eq("owner_id", user.id)
    .maybeSingle();

  const previousPersonalPhotoPath: string | null = existingRow?.personal_photo_path ?? null;
  const previousVehiclePhotoPath: string | null = existingRow?.vehicle_photo_path ?? null;
  const previousVideoPath: string | null = existingRow?.video_path ?? null;

  const { error } = await supabaseAdminClient
    .from("drivers")
    .upsert(
      {
        owner_id: user.id,
        vehicle_type: input.vehicleType,
        province: input.province,
        vehicle_details: vehicleDetails,
        contact_phone: contactPhone,
        personal_photo_path: input.personalPhotoPath,
        vehicle_photo_path: input.vehiclePhotoPath,
        video_path: videoPath,
      },
      { onConflict: "owner_id" }
    );

  if (error) {
    // پاک‌سازی عکس‌ها/ویدئوی یتیم در صورت شکست ثبت — دقیقاً هم‌الگو با createListingAction.
    try {
      const orphanedPaths = [input.personalPhotoPath, ...(input.vehiclePhotoPath ? [input.vehiclePhotoPath] : [])];
      await supabaseAdminClient.storage.from(DRIVERS_BUCKET).remove(orphanedPaths);
      if (videoPath) await supabaseAdminClient.storage.from(DRIVERS_VIDEOS_BUCKET).remove([videoPath]);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false, error: "dbError" };
  }

  // upsert موفق بود. حالا هر مسیر قدیمی که با مسیر تازه فرق دارد (یعنی کاربر آن عکس را عوض یا
  // حذف کرده) از Storage هم پاک می‌شود. عمداً best-effort و بعد از موفقیت upsert.
  const staleImagePaths: string[] = [];
  if (previousPersonalPhotoPath && previousPersonalPhotoPath !== input.personalPhotoPath) {
    staleImagePaths.push(previousPersonalPhotoPath);
  }
  if (previousVehiclePhotoPath && previousVehiclePhotoPath !== input.vehiclePhotoPath) {
    staleImagePaths.push(previousVehiclePhotoPath);
  }
  if (staleImagePaths.length > 0) {
    try {
      await supabaseAdminClient.storage.from(DRIVERS_BUCKET).remove(staleImagePaths);
    } catch {
      // نادیده گرفته می‌شود
    }
  }
  if (previousVideoPath && previousVideoPath !== videoPath) {
    try {
      await supabaseAdminClient.storage.from(DRIVERS_VIDEOS_BUCKET).remove([previousVideoPath]);
    } catch {
      // نادیده گرفته می‌شود
    }
  }

  return { success: true };
}

// تسک ۵ فاز ۰۳ — اکشن سوییچ ساده‌ی «فعال/غیرفعال» راننده. (بدون تغییر)
export async function setDriverActiveStatusAction(
  isActive: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const { data, error } = await supabaseAdminClient
    .from("drivers")
    .update(
      isActive
        ? { is_active: true, last_location_update: new Date().toISOString() }
        : { is_active: false }
    )
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: "dbError" };
  }

  if (!data) {
    return { success: false, error: "profileNotFound" };
  }

  return { success: true };
}

export async function updateDriverLocationAction(
  latitude: number,
  longitude: number
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const isValidCoordinate =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!isValidCoordinate) {
    return { success: false, error: "invalidLocation" };
  }

  const { data, error } = await supabaseAdminClient
    .from("drivers")
    .update({
      location: `SRID=4326;POINT(${longitude} ${latitude})`,
      last_location_update: new Date().toISOString(),
    })
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: "dbError" };
  }

  if (!data) {
    return { success: false, error: "profileNotFound" };
  }

  return { success: true };
}