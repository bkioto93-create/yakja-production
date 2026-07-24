// مسیر فایل: src/app/[lang]/admin/users/actions.ts
// تسک ۲ فاز ۰۷ — اکشن مسدودسازی/رفع مسدودی یک کاربر. دقیقاً هم‌الگو با
// setServiceCategoryActiveAction (فاز ۰۴، تسک ۳) و updateReportStatusAction (فاز ۰۶/۰۷، تسک ۴):
// یک اکشن مجزا و کوچک، نه بخشی از یک فرم ویرایش کامل، چون فقط یک ستون (is_blocked) تغییر می‌کند.
//
// دو محافظت امنیتی/عملیاتی که عمداً اینجا اضافه شده (نه در رابط کاربری تنها):
// ۱. یک ادمین نمی‌تواند خودش را مسدود کند (cannotBlockSelf) — جلوگیری از قفل‌شدن تصادفی خودِ ادمین
//    از پنل مدیریت.
// ۲. هیچ حساب با role='admin' از این مسیر مسدود نمی‌شود (cannotBlockAdmin) — مدیریت حساب‌های
//    ادمین دیگر، اگر لازم شود، باید از مسیر جداگانه‌ای انجام شود، نه از همین سوییچ عمومی کاربران.
// هر دو بررسی سمت سرور انجام می‌شود، نه فقط با مخفی‌کردن دکمه در رابط کاربری (UsersTable.tsx)؛
// یعنی حتی اگر این Server Action مستقیماً (بدون عبور از دکمه‌ی رابط کاربری) صدا زده شود، باز هم
// اعمال نمی‌شود.
//
// **به‌روزرسانی تسک ۷ فاز ۰۷ («ثبت خودکار هر اقدام ادمین در admin_logs»):** پس از موفقیتِ
// خودِ به‌روزرسانی is_blocked، یک ثبت در admin_logs اضافه شد (target=user، اقدام=block/unblock) —
// از طریق logAdminAction (src/lib/admin/adminLogs.ts)، دقیقاً طبق یادداشتی که همین فایل از تسک ۲
// به‌جا مانده بود.
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/adminLogs";

type ActionResult = { success: true } | { success: false; error: string };

export async function setUserBlockedAction(
  lang: string,
  id: string,
  isBlocked: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  if (id === admin.id) return { success: false, error: "cannotBlockSelf" };

  const { data: target, error: fetchError } = await supabaseAdminClient
    .from("users")
    .select("role")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !target) return { success: false, error: "dbError" };
  if (target.role === "admin") return { success: false, error: "cannotBlockAdmin" };

  const { error } = await supabaseAdminClient
    .from("users")
    .update({ is_blocked: isBlocked })
    .eq("id", id);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "user",
    targetId: id,
    action: isBlocked ? "block" : "unblock",
  });

  revalidatePath(`/${lang}/admin/users`);

  return { success: true };
}