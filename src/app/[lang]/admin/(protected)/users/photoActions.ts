// مسیر فایل: src/app/[lang]/admin/(protected)/users/photoActions.ts
// عکس پروفایل کاربر — اکشن تایید/رد یک عکسِ در-انتظار، فقط برای ادمین. دقیقاً هم‌الگو با
// setUserBlockedAction (همین پوشه، فاز ۰۷، تسک ۲): بررسی requireAdmin، به‌روزرسانی یک ستون،
// ثبت خودکار در admin_logs.
//
// چرا رد کردن (reject) عکس را از دیتابیس پاک نمی‌کند: چون کارفرما فقط «تایید/رد» خواسته، نه حذف
// خودکار — اگر عکس رد شود، کاربر در پروفایل خودش می‌بیند که عکسش رد شده و می‌تواند یک عکس تازه
// آپلود کند (که خودش، طبق submitProfilePhotoAction، عکس رد‌شده‌ی قبلی را از Storage پاک می‌کند).
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/adminLogs";

type ActionResult = { success: true } | { success: false; error: string };

export async function setUserPhotoStatusAction(
  lang: string,
  userId: string,
  status: "approved" | "rejected"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { data: target, error: fetchError } = await supabaseAdminClient
    .from("users")
    .select("photo_path")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !target || !target.photo_path) {
    return { success: false, error: "notFound" };
  }

  const { error } = await supabaseAdminClient
    .from("users")
    .update({ photo_status: status })
    .eq("id", userId);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "user_photo",
    targetId: userId,
    action: status === "approved" ? "approve_photo" : "reject_photo",
  });

  revalidatePath(`/${lang}/admin/users`);
  revalidatePath("/[lang]/profile", "page");
  revalidatePath("/[lang]/users/[id]", "page");

  return { success: true };
}