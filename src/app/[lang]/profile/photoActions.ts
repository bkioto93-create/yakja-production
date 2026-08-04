// مسیر فایل: src/app/[lang]/profile/photoActions.ts
// عکس پروفایل کاربر — دو اکشن جدا برای آپلود امن + ثبت نهایی، دقیقاً هم‌الگو با
// src/app/[lang]/profile/storyActions.ts (که خودش هم‌الگو با listings/new/actions.ts است): چون
// auth.uid() در معماری نشست سفارشی این پروژه همیشه null است، مرورگر هرگز نمی‌تواند مستقیم در
// باکت profile-photos بنویسد؛ سرور یک آدرس آپلود امضاشده‌ی موقت صادر می‌کند.
//
// طبق تصمیم صریح کارفرما: هر عکس تازه‌ای که کاربر می‌گذارد، بلافاصله در وضعیت «در انتظار تایید
// مدیریت» قرار می‌گیرد (photo_status='pending') — تا مدیر آن را از پنل ادمین تایید یا رد کند؛
// فقط بعد از تایید، عکس در جاهای دیگر اپ (پروفایل عمومی، حلقه‌ی استوری) واقعاً نمایش داده می‌شود.
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

  const { error } = await supabaseAdminClient
    .from("users")
    .update({ photo_path: photoPath, photo_status: "pending" })
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