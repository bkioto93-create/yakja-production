// مسیر فایل: src/app/[lang]/admin/services/actions.ts
// تسک ۳ فاز ۰۴ — اکشن‌های بخش «مدیریت تخصص‌های خدماتی» پنل ادمین: افزودن، ویرایش، آپلود آیکون
// سفارشی، و سوییچ فعال/غیرفعال. دقیقاً هم‌الگو با src/app/[lang]/transport/driver/actions.ts
// (فاز ۰۳): تمام نوشتن‌ها با supabaseAdminClient انجام می‌شود چون auth.uid() در معماری نشست
// سفارشی این پروژه همیشه null است (بند ۸.۴ سند راهبردی).
//
// **نکته‌ی امنیتی مهم:** برخلاف اکشن‌های ماژول‌های عمومی (کالا/حمل‌ونقل) که فقط «مالکیت ردیف
// خودِ کاربر» را چک می‌کنند، این اکشن‌ها کل جدول service_categories را برای همه‌ی کاربران
// می‌نویسند. چون Policy جدول فقط برای SELECT تعریف شده (نه UPDATE/INSERT — طبق یادداشت تسک ۲:
// «فقط پنل ادمین با Service Role در آن می‌نویسد»)، هر اکشن اینجا با requireAdmin() شروع می‌شود؛
// این‌طور حتی اگر کسی مستقیماً (بدون عبور از رابط کاربری پنل) این Server Action را صدا بزند،
// بدون نشست معتبر «ادمین» هیچ نوشتنی رخ نمی‌دهد.
"use server";

import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { isValidBuiltinIconKey } from "@/lib/services/serviceCategoryIcons";

const ICON_BUCKET = "service-category-icons";
const MAX_ICON_BYTES = 300 * 1024; // ۳۰۰ کیلوبایت — آیکون‌ها همیشه فایل‌های کوچکی‌اند
const ALLOWED_ICON_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

type ActionResult = { success: true } | { success: false; error: string };
type ActionResultWithData<T> = { success: true; data: T } | { success: false; error: string };

// از روی آدرس عمومیِ ذخیره‌شده در ستون icon_url، مسیر داخلی فایل درون باکت را استخراج می‌کند —
// برای پاک‌سازی آیکون سفارشیِ قدیمی/یتیم از Storage، دقیقاً هم‌رویکرد با پاک‌سازی تصاویر آگهی در
// src/app/[lang]/listings/new/actions.ts.
function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${ICON_BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return url.slice(markerIndex + marker.length);
}

async function removeCustomIconFile(iconUrl: string | null) {
  if (!iconUrl) return;
  const path = extractStoragePath(iconUrl);
  if (!path) return;
  try {
    await supabaseAdminClient.storage.from(ICON_BUCKET).remove([path]);
  } catch {
    // نادیده گرفته می‌شود — پاک‌سازی فایل قدیمی حیاتی نیست و نباید مانع ادامه‌ی عملیات اصلی شود.
  }
}

// تسک ۳ — آپلود آیکون سفارشی. برخلاف آپلود تصاویر آگهی (فاز ۰۲) که به‌خاطر حجم بالا و اتصال
// ضعیف کاربر نهایی از «آدرس آپلود امضاشده» استفاده می‌کرد، اینجا یک آپلود مستقیمِ سروری با
// FormData کافی است: فایل، یک آیکون تک (چند ده کیلوبایت) است، و طرف درخواست همیشه خودِ ادمین
// است (نه کاربر نهایی با اینترنت ۲G/۳G)؛ پس هم از سقف پیش‌فرض حجم Server Action رد نمی‌شود و هم
// نیازی به پیچیدگی اضافه نیست.
export async function uploadServiceCategoryIconAction(
  formData: FormData
): Promise<ActionResultWithData<{ url: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, error: "invalidFileType" };

  const ext = ALLOWED_ICON_MIME_TO_EXT[file.type];
  if (!ext) return { success: false, error: "invalidFileType" };

  if (file.size > MAX_ICON_BYTES) return { success: false, error: "fileTooLarge" };

  const path = `custom/${admin.id}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdminClient.storage
    .from(ICON_BUCKET)
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (uploadError) return { success: false, error: "uploadFailed" };

  const { data } = supabaseAdminClient.storage.from(ICON_BUCKET).getPublicUrl(path);
  return { success: true, data: { url: data.publicUrl } };
}

export type ServiceCategoryFormInput = {
  nameFa: string;
  namePs: string;
  iconSource: "builtin" | "custom";
  iconKey: string | null;
  iconUrl: string | null;
};

const MAX_NAME_LENGTH = 60;

function validateInput(input: ServiceCategoryFormInput): string | null {
  const nameFa = input.nameFa.trim();
  const namePs = input.namePs.trim();
  if (!nameFa || !namePs) return "invalidName";
  if (nameFa.length > MAX_NAME_LENGTH || namePs.length > MAX_NAME_LENGTH) return "invalidName";

  if (input.iconSource === "builtin") {
    if (!input.iconKey || !isValidBuiltinIconKey(input.iconKey)) return "invalidIcon";
  } else if (input.iconSource === "custom") {
    if (!input.iconUrl) return "invalidIcon";
  } else {
    return "invalidIcon";
  }

  return null;
}

// تسک ۳ — افزودن تخصص جدید. display_order به‌صورت خودکار «بعد از بزرگ‌ترین مقدار فعلی» تنظیم
// می‌شود (یعنی هر تخصص تازه، در انتهای فهرست ظاهر می‌شود)؛ این تسک شامل جابه‌جایی/ترتیب‌دهی
// دستی نیست — طبق متن دقیق تسک ۳ که فقط «افزودن، ویرایش، غیرفعال/فعال‌سازی» را خواسته.
export async function createServiceCategoryAction(
  input: ServiceCategoryFormInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const { data: lastRow } = await supabaseAdminClient
    .from("service_categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (lastRow?.display_order ?? 0) + 1;

  const { error } = await supabaseAdminClient.from("service_categories").insert({
    name_fa: input.nameFa.trim(),
    name_ps: input.namePs.trim(),
    icon_source: input.iconSource,
    icon_key: input.iconSource === "builtin" ? input.iconKey : null,
    icon_url: input.iconSource === "custom" ? input.iconUrl : null,
    display_order: nextOrder,
    created_by: admin.id,
  });

  if (error) {
    // اگر ثبت ردیف شکست خورد ولی آیکون سفارشی از قبل آپلود شده بود، آن فایل یتیم پاک می‌شود
    // (دقیقاً هم‌رویکرد با پاک‌سازی عکس‌های یتیم در createListingAction، فاز ۰۲).
    if (input.iconSource === "custom") await removeCustomIconFile(input.iconUrl);
    return { success: false, error: "dbError" };
  }

  return { success: true };
}

// تسک ۳ — ویرایش تخصص موجود (نام دری/پشتو + آیکون). اگر آیکون سفارشیِ قبلی با چیز دیگری
// (آیکون کتابخانه‌ای یا آیکون سفارشیِ تازه) جایگزین شد، فایل قدیمی از Storage پاک می‌شود تا
// باکت service-category-icons پر از فایل‌های یتیم نشود.
export async function updateServiceCategoryAction(
  id: string,
  input: ServiceCategoryFormInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const { data: existing } = await supabaseAdminClient
    .from("service_categories")
    .select("icon_source, icon_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdminClient
    .from("service_categories")
    .update({
      name_fa: input.nameFa.trim(),
      name_ps: input.namePs.trim(),
      icon_source: input.iconSource,
      icon_key: input.iconSource === "builtin" ? input.iconKey : null,
      icon_url: input.iconSource === "custom" ? input.iconUrl : null,
    })
    .eq("id", id);

  if (error) return { success: false, error: "dbError" };

  const oldIconUrl = existing?.icon_source === "custom" ? existing.icon_url : null;
  if (oldIconUrl && oldIconUrl !== input.iconUrl) {
    await removeCustomIconFile(oldIconUrl);
  }

  return { success: true };
}

// تسک ۳ — سوییچ فعال/غیرفعال، عمداً یک اکشن مجزا از ویرایش کامل (دقیقاً هم‌الگو با
// setDriverActiveStatusAction فاز ۰۳): با هر بار زدن سوییچ، کل فرم دوباره ارسال نمی‌شود.
// این «غیرفعال‌سازی» است، نه حذف فیزیکی — طبق بند ۱ یادداشت مصوب فاز ۰۴، ردیف هرگز از جدول
// پاک نمی‌شود.
export async function setServiceCategoryActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { error } = await supabaseAdminClient
    .from("service_categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: "dbError" };

  return { success: true };
}