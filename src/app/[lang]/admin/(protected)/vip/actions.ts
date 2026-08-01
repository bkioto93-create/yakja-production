// مسیر فایل: src/app/[lang]/admin/(protected)/vip/actions.ts
// فاز ۱۱ — اکشن‌های بخش «اشتراک VIP» پنل مدیریت (بند ۸ پرامپت VIP): تایید/رد یک درخواست + ویرایش
// تنظیمات VIP (قیمت/اطلاعات بانک/اطلاعات صرافی). دقیقاً هم‌الگو با
// src/app/[lang]/admin/(protected)/listings/actions.ts: هر دو اکشن پس از موفقیت در admin_logs
// ثبت می‌شوند (logAdminAction، طبق بند ۸.۲ پرامپت).
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/adminLogs";
import { updateVipSettings } from "@/lib/vip/platformSettings";

type ActionResult = { success: true } | { success: false; error: string };

// تایید یک درخواست VIP: کاربر VIP می‌شود، تاریخ انقضا = الان + ۱ ماه (اگر از قبل هم VIP فعال
// داشت، ۱ ماه به تاریخ انقضای فعلی‌اش اضافه می‌شود، نه از صفر — طبق بند ۲، مرحله‌ی ۷ پرامپت، تا
// کاربری که زودتر تمدید می‌کند ضرر نکند).
export async function approveVipRequestAction(
  lang: string,
  requestId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { data: request, error: fetchError } = await supabaseAdminClient
    .from("vip_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request) return { success: false, error: "notFound" };
  if (request.status !== "pending") return { success: false, error: "alreadyReviewed" };

  const { data: userRow, error: userError } = await supabaseAdminClient
    .from("users")
    .select("vip_expires_at")
    .eq("id", request.user_id)
    .maybeSingle();

  if (userError || !userRow) return { success: false, error: "userNotFound" };

  const now = Date.now();
  const currentExpiry = userRow.vip_expires_at ? new Date(userRow.vip_expires_at).getTime() : 0;
  const baseTime = Math.max(now, currentExpiry);
  const newExpiresAt = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString(); // ۱ ماه = ۳۰ روز

  const { error: updateUserError } = await supabaseAdminClient
    .from("users")
    .update({ vip_expires_at: newExpiresAt })
    .eq("id", request.user_id);

  if (updateUserError) return { success: false, error: "dbError" };

  const { error: updateRequestError } = await supabaseAdminClient
    .from("vip_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", requestId);

  if (updateRequestError) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "vip_request",
    targetId: requestId,
    action: "approved",
  });

  revalidatePath(`/${lang}/admin/vip`);

  return { success: true };
}

export async function rejectVipRequestAction(
  lang: string,
  requestId: string,
  rejectionReason: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { data: request, error: fetchError } = await supabaseAdminClient
    .from("vip_requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request) return { success: false, error: "notFound" };
  if (request.status !== "pending") return { success: false, error: "alreadyReviewed" };

  const { error } = await supabaseAdminClient
    .from("vip_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      rejection_reason: rejectionReason.trim() || null,
    })
    .eq("id", requestId);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "vip_request",
    targetId: requestId,
    action: "rejected",
  });

  revalidatePath(`/${lang}/admin/vip`);

  return { success: true };
}

export async function updateVipSettingsAction(
  lang: string,
  input: { monthlyPrice: string; bankDetails: string; exchangeDetails: string }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const success = await updateVipSettings(input);
  if (!success) return { success: false, error: "invalidPrice" };

  // دقیقاً هم‌الگو با اقدام «بک‌آپ» (تسک ۸ فاز ۰۷): چون این اقدام روی یک رکورد مشخص از جداول
  // کاربری عمل نمی‌کند، شناسه‌ی خودِ ادمین به‌عنوان target_id ثبت می‌شود.
  await logAdminAction({
    adminId: admin.id,
    targetType: "system",
    targetId: admin.id,
    action: "update_vip_settings",
  });

  revalidatePath(`/${lang}/admin/vip`);
  revalidatePath(`/${lang}/vip`);

  return { success: true };
}