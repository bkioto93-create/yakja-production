// مسیر فایل: src/app/[lang]/admin/reports/actions.ts
// تسک ۵ فاز ۰۶ (معادل تسک ۴ فاز ۰۷) — اکشن تغییر وضعیت یک گزارش در صف بررسی.
//
// طبق تسک ۶ فاز ۰۶ («اطمینان از عدم انجام هیچ اقدام تنبیهی خودکار»)، این اکشن عمداً فقط ستون
// status جدول reports را تغییر می‌دهد — هیچ مسدودسازی/حذفی روی خودِ target انجام نمی‌شود؛ هر
// اقدام تنبیهی (اگر ادمین پس از بررسی لازم دید) باید جداگانه از بخش مربوطه‌ی پنل مدیریت (تسک‌های
// ۲/۳ فاز ۰۷، هنوز ساخته نشده‌اند) انجام شود.
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/reports/adminReportQueries";

const VALID_STATUSES: ReportStatus[] = ["pending", "reviewed", "resolved"];

type ActionResult = { success: true } | { success: false; error: string };

export async function updateReportStatusAction(
  lang: string,
  id: string,
  status: ReportStatus
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  if (!VALID_STATUSES.includes(status)) return { success: false, error: "invalidStatus" };

  const { error } = await supabaseAdminClient.from("reports").update({ status }).eq("id", id);

  if (error) return { success: false, error: "dbError" };

  revalidatePath(`/${lang}/admin/reports`);
  revalidatePath(`/${lang}/admin`);

  return { success: true };
}