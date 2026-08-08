// مسیر فایل: src/app/[lang]/profile/photoActions.ts
// عکس پروفایل کاربر — دو اکشن جدا برای آپلود امن + ثبت نهایی، دقیقاً هم‌الگو با
// src/app/[lang]/profile/storyActions.ts (که خودش هم‌الگو با listings/new/actions.ts است): چون
// auth.uid() در معماری نشست سفارشی این پروژه همیشه null است، مرورگر هرگز نمی‌تواند مستقیم در
// باکت profile-photos بنویسد؛ سرور یک آدرس آپلود امضاشده‌ی موقت صادر می‌کند.
//
// طبق تصمیم صریح کارفرما: هر عکس تازه‌ای که کاربر می‌گذارد، بلافاصله در وضعیت «در انتظار تایید
// مدیریت» قرار می‌گیرد (photo_status='pending') — تا مدیر آن را از پنل ادمین تایید یا رد کند؛
// فقط بعد از تایید، عکس در جاهای دیگر اپ (پروفایل عمومی، حلقه‌ی استوری) واقعاً نمایش داده می‌شود.
//
// **به‌روزرسانی (تایید خودکار عکس خودِ ادمین):** طبق تصمیم تازه‌ی صریح کارفرما — «ادمین که خودش
// مسئولِ تاییدِ عکس‌هاست، نیازی به تاییدِ خودش ندارد» — این قاعده فقط برای role==='admin' یک
// استثنا دارد: عکسِ تازه‌ی خودِ ادمین بلافاصله در وضعیتِ approved ثبت می‌شود، نه pending. کاربرانِ
// عادی (role==='user') دقیقاً همان رفتارِ قبلی را دارند و هم‌چنان در انتظارِ تاییدِ ادمین می‌مانند.
//
// **افزوده‌شده (دکمه‌ی حذف عکس پروفایل خودِ کاربر):** طبق درخواست صریح کارفرما — «کاربر عادی هم
// باید بتواند عکس پروفایل خودش را پاک کند، فرقی نمی‌کند تاییدشده باشد یا نه؛ در سیستم فعلی هیچ
// راهی برای این کار نبود» — اکشن تازه‌ی deleteMyProfilePhotoAction اضافه شد. برخلاف submitProfilePhotoAction
// (که فقط برای کاربرِ صاحبِ نشست معنا دارد و همیشه بر اساسِ user.id خودِ همان نشست عمل می‌کند،
// نه یک userId ورودی از کلاینت)، این اکشن هم دقیقاً همان الگو را دارد — کاربر فقط می‌تواند عکسِ
// خودش را پاک کند، نه هیچ کاربر دیگری را؛ نیازی به گرفتنِ شناسه از کلاینت هم نیست.
"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

const PROFILE_PHOTOS_BUCKET = "profile-photos";

export type SignedUploadSlot = { path: string; token: string };

export async function createSignedProfilePhotoUploadSlotAction(): Promise<
  { success: true; slot: SignedUploadSlot } | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  // قرارداد مسیر فایل طبق فاز ۰۰: {owner_id}/{filename} — سرور خودش مسیر را می‌سازد.
  const path = `${user.id}/${Date.now()}.jpg`;

  const { data, error } = await supabaseAdminClient.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

export async function submitProfilePhotoAction(
  photoPath: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  // دفاع در عمق: هیچ مسیر عکسی نباید بیرون از پوشه‌ی خودِ همین کاربر باشد.
  if (!photoPath.startsWith(`${user.id}/`)) {
    return { success: false, error: "invalidPhotoData" };
  }

  // عکسِ قبلی (در صورت وجود) را قبل از جایگزینی می‌خوانیم، تا بعد از ثبت موفق عکس تازه، فایل
  // قدیمی را از Storage پاک کنیم — وگرنه با هر بار تغییر عکس، یک فایل یتیم در باکت باقی می‌ماند.
  const { data: existing } = await supabaseAdminClient
    .from("users")
    .select("photo_path")
    .eq("id", user.id)
    .maybeSingle();

  const previousPhotoPath = existing?.photo_path as string | null | undefined;

  // ادمین خودش مرجعِ تاییدِ عکس است؛ پس عکسِ خودش نیازی به گذر از صفِ «در انتظار تایید» ندارد و
  // بلافاصله تاییدشده ثبت می‌شود. برای هر کاربرِ دیگری، رفتار دقیقاً همان قبلی (pending) است.
  const nextPhotoStatus: "pending" | "approved" = user.role === "admin" ? "approved" : "pending";

  const { error } = await supabaseAdminClient
    .from("users")
    .update({ photo_path: photoPath, photo_status: nextPhotoStatus })
    .eq("id", user.id);

  if (error) {
    try {
      await supabaseAdminClient.storage.from(PROFILE_PHOTOS_BUCKET).remove([photoPath]);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false, error: "dbError" };
  }

  if (previousPhotoPath && previousPhotoPath !== photoPath) {
    try {
      await supabaseAdminClient.storage.from(PROFILE_PHOTOS_BUCKET).remove([previousPhotoPath]);
    } catch {
      // فایل یتیم در Storage خیلی بهتر از یک خطای نمایشی برای کاربر است.
    }
  }

  revalidatePath("/[lang]/profile", "page");
  revalidatePath("/[lang]/users/[id]", "page");

  return { success: true };
}

// حذفِ عکسِ پروفایلِ خودِ کاربرِ واردشده — کاملاً مستقل از وضعیتِ فعلیِ عکس (در انتظار/تاییدشده/
// ردشده)؛ چون هدف این است که کاربر همیشه راهی برای «برداشتنِ عکسِ خودش» داشته باشد، نه فقط وقتی
// رد شده. هم ردیفِ دیتابیس (photo_path/photo_status → null) و هم خودِ فایل از Storage پاک
// می‌شود؛ بعد از این، کاربر دقیقاً در همان حالتِ «هنوز عکسی نگذاشته» قرار می‌گیرد و می‌تواند از
// نو یک عکس تازه آپلود کند.
export async function deleteMyProfilePhotoAction(): Promise<
  { success: true } | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const { data: existing, error: fetchError } = await supabaseAdminClient
    .from("users")
    .select("photo_path")
    .eq("id", user.id)
    .maybeSingle();

  const photoPath = existing?.photo_path as string | null | undefined;
  if (fetchError || !photoPath) {
    return { success: false, error: "notFound" };
  }

  const { error } = await supabaseAdminClient
    .from("users")
    .update({ photo_path: null, photo_status: null })
    .eq("id", user.id);

  if (error) return { success: false, error: "dbError" };

  try {
    await supabaseAdminClient.storage.from(PROFILE_PHOTOS_BUCKET).remove([photoPath]);
  } catch {
    // فایل یتیم در Storage خیلی بهتر از یک خطای نمایشی برای کاربر است — همان رویکردِ محافظه‌کارانه‌ای
    // که در بقیه‌ی اکشن‌های پاک‌سازیِ Storage همین فایل (بالاتر) استفاده شده.
  }

  revalidatePath("/[lang]/profile", "page");
  revalidatePath("/[lang]/users/[id]", "page");

  return { success: true };
}