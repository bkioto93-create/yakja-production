// مسیر فایل: src/app/[lang]/report/new/actions.ts
// تسک ۴ فاز ۰۶ — Server Action ثبت گزارش تخلف. دقیقاً هم‌الگو با
// src/app/[lang]/services/provider/actions.ts (فاز ۰۴، تسک ۶): تمام اعتبارسنجی و نوشتن سمت سرور
// با supabaseAdminClient انجام می‌شود، چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null
// است (بند ۸.۴ سند راهبردی) و Policyهای RLS جدول reports (تسک ۲ همین فاز) صرفاً دفاع‌در-عمق‌اند؛
// مالکیت واقعی reporter_id اینجا، با شناسه‌ی کاربرِ نشست فعلی (getCurrentUser)، تضمین می‌شود.
//
// ⚠️ تکمیل نکته‌ی معلق تسک ۱ همین فاز («اعتبارسنجی واقعیِ وجود ردیفِ هدف، در Server Action ثبت
// گزارش انجام خواهد شد»): پیش از درج گزارش، وجود واقعیِ ردیفِ target_id در جدول متناظرِ
// target_type بررسی می‌شود (TARGET_TABLE_MAP پایین همین فایل)؛ اگر آن ردیف پیدا نشد (مثلاً چون
// همزمان توسط ادمین یا خودِ صاحب آن حذف شده)، خطای «targetNotFound» برگردانده می‌شود — نه یک خطای
// دیتابیسی مبهم.
//
// همچنین به‌عنوان یک محافظت منطقی اضافه (خارج از متن دقیق تسک، اما هم‌راستا با هدف کلی این فاز):
// اگر target_type برابر «user» بود و target_id همان شناسه‌ی کاربرِ گزارش‌دهنده بود، گزارش رد
// می‌شود («cannotReportSelf») — گزارش‌دادن پروفایل خودِ فرد منطقی نیست.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidReportTargetType, type ReportTargetType } from "@/lib/reports/reportTargets";
import { isValidReportReason } from "@/lib/reports/reasons";

// نگاشت هر target_type به نام جدول واقعیِ متناظر در دیتابیس — صرفاً برای بررسی «آیا این ردیف
// اصلاً وجود دارد؟» پیش از درج گزارش؛ هیچ FK واقعی روی reports.target_id تعریف نشده (طبق طراحی
// چندریختی تسک ۱ همین فاز)، پس این بررسی باید همیشه صریحاً سمت کد انجام شود.
const TARGET_TABLE_MAP: Record<ReportTargetType, string> = {
  listing: "listings",
  driver: "drivers",
  service_provider: "service_providers",
  real_estate: "real_estate",
  user: "users",
};

export async function createReportAction(input: {
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const targetType = input.targetType;
  const targetId = input.targetId?.trim();

  if (!targetType || !targetId || !isValidReportTargetType(targetType)) {
    return { success: false, error: "invalidTarget" };
  }

  if (!isValidReportReason(input.reason)) {
    return { success: false, error: "invalidReason" };
  }

  if (targetType === "user" && targetId === user.id) {
    return { success: false, error: "cannotReportSelf" };
  }

  // بررسی وجود واقعیِ ردیف هدف — شرح کامل در کامنت بالای فایل.
  const targetTable = TARGET_TABLE_MAP[targetType];
  const { data: targetRow, error: targetLookupError } = await supabaseAdminClient
    .from(targetTable)
    .select("id")
    .eq("id", targetId)
    .maybeSingle();

  if (targetLookupError || !targetRow) {
    return { success: false, error: "targetNotFound" };
  }

  const description = input.description?.trim() || null;

  const { error } = await supabaseAdminClient.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: input.reason,
    description,
    status: "pending",
  });

  if (error) {
    return { success: false, error: "dbError" };
  }

  return { success: true };
}