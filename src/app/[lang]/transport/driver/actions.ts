// مسیر فایل: src/app/[lang]/transport/driver/actions.ts
// تسک ۴ فاز ۰۳ — اکشن ثبت/ویرایش پروفایل راننده. دقیقاً هم‌الگو با
// src/app/[lang]/listings/new/actions.ts (فاز ۰۲، تسک ۴/۵): تمام اعتبارسنجی و نوشتن سمت سرور با
// supabaseAdminClient انجام می‌شود، چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null
// است (بند ۸.۴ سند راهبردی) و Policyهای RLS جدول drivers صرفاً دفاع‌در-عمق‌اند.
// عملیات saveDriverProfileAction یک upsert واحد است: اگر کاربر از قبل پروفایل راننده دارد، همان
// ردیف به‌روزرسانی می‌شود؛ در غیر این صورت ردیف جدید ساخته می‌شود. یکتایی هر کاربر=یک پروفایل
// راننده با Unique Constraint روی drivers.owner_id (فایل 08_phase_03_drivers_owner_unique.sql)
// در دیتابیس تضمین شده است.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** ستون drivers.images
// (20_phase_08b_transport_services_photos.sql) به‌همراه یک اکشن جدید createDriverSignedUploadSlotsAction
// اضافه شد — دقیقاً هم‌الگو با createSignedUploadSlotsAction در listings/new/actions.ts (فاز ۰۲):
// چون auth.uid() همیشه null است، مرورگر با Anon Key نمی‌تواند مستقیم در باکت drivers-images
// بنویسد؛ این سرور چند «آدرس آپلود امضاشده‌ی موقت» صادر می‌کند و مرورگر مستقیماً (بدون عبور از
// سرور Next.js) عکس فشرده‌شده را به همان آدرس می‌فرستد — سبک‌تر برای اینترنت ۲G/۳G. عکس کاملاً
// اختیاری است (برخلاف آگهی کالا که حداقل ۱ عکس الزامی بود)؛ حداکثر ۵ عکس.
//
// **به‌روزرسانی نظافت (۱۴۰۵/۰۵ — پیگیری یادداشت ممیزی تسک ۱ فاز ۰۸):** saveDriverProfileAction
// پیش از upsert، آرایه‌ی images *فعلاً ذخیره‌شده در دیتابیس* را می‌خواند. بعد از upsert موفق، هر
// مسیری که در آرایه‌ی قدیم بود ولی در آرایه‌ی تازه‌ی ورودی نیست (یعنی کاربر آن عکس را در حالت
// ویرایش حذف کرده) با storage.remove از باکت drivers-images هم واقعاً پاک می‌شود — قبل از این،
// فقط از ستون images حذف می‌شد و خودِ فایل در Storage یتیم می‌ماند (رفتاری بی‌خطر ولی ناقص که در
// ممیزی تسک ۱ همین فاز مستند شده بود). این پاک‌سازی عمداً best-effort و بعد از موفقیت upsert
// است: اگر خودِ حذف فایل با خطا مواجه شود، ذخیره‌ی پروفایل که واقعاً موفق بوده نباید به کاربر
// «شکست‌خورده» نشان داده شود؛ در بدترین حالت یک فایل یتیم باقی می‌ماند که در ذخیره‌ی بعدی همین
// پروفایل (یا یک پاک‌سازی دوره‌ای جداگانه در آینده) جبران می‌شود.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** createDriverSignedVideoUploadSlotAction اضافه شد (دقیقاً
// هم‌الگو با نسخه‌ی مشابهش در listings/new/actions.ts، گیت‌شده سمت سرور با isUserVip).
// saveDriverProfileAction هم videoPath را می‌پذیرد و همان منطق نظافتِ فایل یتیم که برای عکس‌ها
// وجود داشت، برای ویدئوی جایگزین‌شده/حذف‌شده هم اعمال شد. پروفایل راننده مشمول سقف روزانه‌ی ۲
// آگهی نیست (طبق تعریف src/lib/vip/dailyPostLimit.ts، آن سقف فقط listings+real_estate است).
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
const MAX_IMAGES = 5;

export type SignedUploadSlot = { path: string; token: string };

// اکشن جدید — صدور آدرس‌های آپلود امضاشده برای عکس‌های پروفایل راننده، دقیقاً هم‌الگو با
// createSignedUploadSlotsAction در listings/new/actions.ts (فاز ۰۲)؛ تنها تفاوت: سقف تعداد بدون
// کف حداقلی (۰ تا ۵)، چون عکس اینجا اختیاری است.
export async function createDriverSignedUploadSlotsAction(
  count: number
): Promise<{ success: true; slots: SignedUploadSlot[] } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (!Number.isInteger(count) || count < 0 || count > MAX_IMAGES) {
    return { success: false, error: "invalidImageCount" };
  }

  const slots: SignedUploadSlot[] = [];
  for (let i = 0; i < count; i++) {
    // قرارداد مسیر فایل طبق فاز ۰۰: {owner_id}/{filename} — سرور خودش مسیر را می‌سازد، پس
    // کلاینت هیچ‌وقت نمی‌تواند مسیری بیرون از پوشه‌ی خودش تولید کند.
    const path = `${user.id}/${Date.now()}_${i}.jpg`;
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
  imagePaths: string[];
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

  if (!Array.isArray(input.imagePaths) || input.imagePaths.length > MAX_IMAGES) {
    return { success: false, error: "invalidImageCount" };
  }

  // دفاع در عمق: هیچ مسیر تصویری نباید بیرون از پوشه‌ی خودِ همین کاربر باشد — دقیقاً هم‌الگو با
  // createListingAction (فاز ۰۲).
  const ownsAllPaths = input.imagePaths.every((p) => p.startsWith(`${user.id}/`));
  if (!ownsAllPaths) return { success: false, error: "invalidImageData" };

  // فاز ۱۱ — گیت‌کردن واقعی ویدئو، دوباره سمت سرور.
  let videoPath: string | null = null;
  if (input.videoPath) {
    if (!isVip) return { success: false, error: "notVip" };
    if (!input.videoPath.startsWith(`${user.id}/`)) return { success: false, error: "invalidVideoData" };
    videoPath = input.videoPath;
  }

  const vehicleDetails = input.vehicleDetails.trim() || null;

  // نظافت تصاویر/ویدئوی یتیم: پیش از upsert، مقادیر فعلی (پیش از این ذخیره) خوانده می‌شوند تا
  // بعداً بتوان مسیرهای حذف‌شده توسط کاربر را تشخیص داد. اگر ردیفی هنوز وجود نداشته باشد (اولین
  // ثبت پروفایل)، previousImages/previousVideoPath به‌درستی خالی/null خواهند بود.
  const { data: existingRow } = await supabaseAdminClient
    .from("drivers")
    .select("images, video_path")
    .eq("owner_id", user.id)
    .maybeSingle();

  const previousImages: string[] = existingRow?.images ?? [];
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
        images: input.imagePaths,
        video_path: videoPath,
      },
      { onConflict: "owner_id" }
    );

  if (error) {
    // پاک‌سازی تصاویر/ویدئوی یتیم در صورت شکست ثبت — دقیقاً هم‌الگو با createListingAction.
    try {
      await supabaseAdminClient.storage.from(DRIVERS_BUCKET).remove(input.imagePaths);
      if (videoPath) await supabaseAdminClient.storage.from(DRIVERS_VIDEOS_BUCKET).remove([videoPath]);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false, error: "dbError" };
  }

  // upsert موفق بود. حالا مسیرهایی که در آرایه/مقدار قدیم بودند ولی کاربر آن‌ها را در همین ذخیره
  // حذف/جایگزین کرده را از باکت Storage هم پاک می‌کنیم. عمداً best-effort و بعد از موفقیت upsert.
  const removedPaths = previousImages.filter((p) => !input.imagePaths.includes(p));
  if (removedPaths.length > 0) {
    try {
      await supabaseAdminClient.storage.from(DRIVERS_BUCKET).remove(removedPaths);
    } catch {
      // نادیده گرفته می‌شود — دلیل بالا
    }
  }
  if (previousVideoPath && previousVideoPath !== videoPath) {
    try {
      await supabaseAdminClient.storage.from(DRIVERS_VIDEOS_BUCKET).remove([previousVideoPath]);
    } catch {
      // نادیده گرفته می‌شود — دلیل بالا
    }
  }

  return { success: true };
}

// تسک ۵ فاز ۰۳ — اکشن سوییچ ساده‌ی «فعال/غیرفعال» راننده. عمداً یک اکشن کاملاً مجزا از
// saveDriverProfileAction است (نه بخشی از همان upsert) چون این دو عملیات، رویدادهای کاربری کاملاً
// متفاوتی هستند: یکی «ذخیره‌ی فرم پروفایل» و دیگری «صرفاً یک کلیک روی سوییچ»؛ جدا نگه‌داشتن‌شان
// باعث می‌شود با هر بار زدن سوییچ، کل فرم (نوع وسیله/مشخصات/شماره تماس/عکس‌ها) دوباره به سرور
// ارسال نشود — مهم روی اینترنت ضعیف (بند ۵.۳ سند راهبردی).
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