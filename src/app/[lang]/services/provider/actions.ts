// مسیر فایل: src/app/[lang]/services/provider/actions.ts
// تسک ۶ فاز ۰۴ — اکشن ثبت/ویرایش پروفایل متخصص. دقیقاً هم‌الگو با
// src/app/[lang]/transport/driver/actions.ts (فاز ۰۳، تسک ۴): تمام اعتبارسنجی و نوشتن سمت سرور
// با supabaseAdminClient انجام می‌شود، چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null
// است (بند ۸.۴ سند راهبردی) و Policyهای RLS جدول service_providers صرفاً دفاع‌در-عمق‌اند.
// عملیات یک upsert واحد است: اگر کاربر از قبل پروفایل متخصص دارد، همان ردیف به‌روزرسانی می‌شود؛
// در غیر این صورت ردیف جدید ساخته می‌شود. یکتایی هر کاربر=یک پروفایل متخصص با Unique Constraint
// روی service_providers.owner_id (فایل 14_phase_04_service_providers_owner_unique.sql) در
// دیتابیس تضمین شده است.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** ستون service_providers.images
// (20_phase_08b_transport_services_photos.sql) به‌همراه یک اکشن جدید
// createServiceProviderSignedUploadSlotsAction اضافه شد — دقیقاً هم‌الگو با اکشن معادل در
// transport/driver/actions.ts. اینجا عکس‌ها نقش «گالری نمونه‌کار» را دارند (تا مشتری پیش از تماس
// کیفیت کار متخصص را ببیند)، کاملاً اختیاری، حداکثر ۵ عکس.
//
// **به‌روزرسانی نظافت (۱۴۰۵/۰۵ — پیگیری یادداشت ممیزی تسک ۱ فاز ۰۸):** saveServiceProviderProfileAction
// پیش از upsert، آرایه‌ی images *فعلاً ذخیره‌شده در دیتابیس* را می‌خواند. بعد از upsert موفق، هر
// مسیری که در آرایه‌ی قدیم بود ولی در آرایه‌ی تازه‌ی ورودی نیست (یعنی کاربر آن عکس را در حالت
// ویرایش حذف کرده) با storage.remove از باکت service-providers-images هم واقعاً پاک می‌شود — قبل
// از این، فقط از ستون images حذف می‌شد و خودِ فایل در Storage یتیم می‌ماند (رفتاری بی‌خطر ولی ناقص
// که در ممیزی تسک ۱ همین فاز مستند شده بود). این پاک‌سازی عمداً best-effort و بعد از موفقیت
// upsert است: اگر خودِ حذف فایل با خطا مواجه شود، ذخیره‌ی پروفایل که واقعاً موفق بوده نباید به
// کاربر «شکست‌خورده» نشان داده شود؛ در بدترین حالت یک فایل یتیم باقی می‌ماند که در ذخیره‌ی بعدی
// همین پروفایل (یا یک پاک‌سازی دوره‌ای جداگانه در آینده) جبران می‌شود.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeAfghanPhone } from "@/lib/phone";
import { toAsciiDigits } from "@/lib/marketplace/numbers";

const FOREIGN_KEY_VIOLATION_CODE = "23503";
const SERVICE_PROVIDERS_BUCKET = "service-providers-images";
const MAX_IMAGES = 5;

export type SignedUploadSlot = { path: string; token: string };

// اکشن جدید — صدور آدرس‌های آپلود امضاشده برای عکس‌های نمونه‌کار متخصص، دقیقاً هم‌الگو با
// createDriverSignedUploadSlotsAction.
export async function createServiceProviderSignedUploadSlotsAction(
  count: number
): Promise<{ success: true; slots: SignedUploadSlot[] } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (!Number.isInteger(count) || count < 0 || count > MAX_IMAGES) {
    return { success: false, error: "invalidImageCount" };
  }

  const slots: SignedUploadSlot[] = [];
  for (let i = 0; i < count; i++) {
    const path = `${user.id}/${Date.now()}_${i}.jpg`;
    const { data, error } = await supabaseAdminClient.storage
      .from(SERVICE_PROVIDERS_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { success: false, error: "uploadFailed" };
    }
    slots.push({ path: data.path, token: data.token });
  }

  return { success: true, slots };
}

export async function saveServiceProviderProfileAction(input: {
  serviceCategoryId: string;
  address: string;
  contactPhone: string;
  description: string;
  imagePaths: string[];
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const serviceCategoryId = input.serviceCategoryId.trim();
  if (!serviceCategoryId) {
    return { success: false, error: "invalidCategory" };
  }

  const address = input.address.trim();
  if (!address) return { success: false, error: "invalidAddress" };

  const contactPhone = normalizeAfghanPhone(toAsciiDigits(input.contactPhone));
  if (!contactPhone) return { success: false, error: "invalidPhone" };

  if (!Array.isArray(input.imagePaths) || input.imagePaths.length > MAX_IMAGES) {
    return { success: false, error: "invalidImageCount" };
  }

  const ownsAllPaths = input.imagePaths.every((p) => p.startsWith(`${user.id}/`));
  if (!ownsAllPaths) return { success: false, error: "invalidImageData" };

  const description = input.description.trim() || null;

  const row = {
    owner_id: user.id,
    service_category_id: serviceCategoryId,
    contact_phone: contactPhone,
    address,
    description,
    images: input.imagePaths,
  };

  // ساخت مقدار geography از مختصات مرورگر — دقیقاً هم‌الگو با نسخه‌ی قبلی این اکشن: چون این یک
  // upsert است، اگر مختصات این‌بار در دسترس نبود، کلید location اصلاً به payload اضافه نمی‌شود
  // (نه اینکه با null بازنویسی شود) تا موقعیت مکانیِ ثبت‌شده در دفعه‌ی قبل حفظ بماند.
  const hasValidCoords =
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);

  const payload = hasValidCoords
    ? { ...row, location: `SRID=4326;POINT(${input.longitude} ${input.latitude})` }
    : row;

  // نظافت تصاویر یتیم: پیش از upsert، آرایه‌ی images فعلی (پیش از این ذخیره) خوانده می‌شود تا
  // بعداً بتوان مسیرهای حذف‌شده توسط کاربر را تشخیص داد. اگر ردیفی هنوز وجود نداشته باشد (اولین
  // ثبت پروفایل)، previousImages به‌درستی آرایه‌ی خالی خواهد بود.
  const { data: existingRow } = await supabaseAdminClient
    .from("service_providers")
    .select("images")
    .eq("owner_id", user.id)
    .maybeSingle();

  const previousImages: string[] = existingRow?.images ?? [];

  const { error } = await supabaseAdminClient
    .from("service_providers")
    .upsert(payload, { onConflict: "owner_id" });

  if (error) {
    if (error.code === FOREIGN_KEY_VIOLATION_CODE) {
      return { success: false, error: "invalidCategory" };
    }
    // پاک‌سازی تصاویر یتیم در صورت شکست ثبت — دقیقاً هم‌الگو با createListingAction (فاز ۰۲).
    try {
      await supabaseAdminClient.storage.from(SERVICE_PROVIDERS_BUCKET).remove(input.imagePaths);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false, error: "dbError" };
  }

  // upsert موفق بود. حالا مسیرهایی که در آرایه‌ی قدیم بودند ولی کاربر آن‌ها را در همین ذخیره حذف
  // کرده (یعنی در آرایه‌ی تازه‌ی ورودی نیستند) را از باکت Storage هم پاک می‌کنیم. عمداً best-effort
  // و بعد از موفقیت upsert: خطای احتمالی اینجا نباید ذخیره‌ی موفقِ پروفایل را به کاربر «شکست» نشان
  // دهد؛ در بدترین حالت یک فایل یتیم باقی می‌ماند که دفعه‌ی بعد جبران می‌شود.
  const removedPaths = previousImages.filter((p) => !input.imagePaths.includes(p));
  if (removedPaths.length > 0) {
    try {
      await supabaseAdminClient.storage.from(SERVICE_PROVIDERS_BUCKET).remove(removedPaths);
    } catch {
      // نادیده گرفته می‌شود — دلیل بالا
    }
  }

  return { success: true };
}