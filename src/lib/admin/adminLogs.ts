// مسیر فایل: src/lib/admin/adminLogs.ts
// تسک ۷ فاز ۰۷ — «ثبت خودکار هر اقدام ادمین در جدول admin_logs».
//
// این فایل یک تابع کمکی واحد (logAdminAction) فراهم می‌کند تا هر Server Action/Route Handler
// ادمین، بعد از موفقیتِ خودِ تغییر اصلی، همین یک تابع را صدا بزند — به‌جای تکرار کد insert.
//
// **به‌روزرسانی تسک ۸ فاز ۰۷ (دکمه‌ی بک‌آپ):** مقدار تازه‌ی "system" به AdminLogTargetType اضافه
// شد؛ چون بک‌آپ (برخلاف بلاک‌کردن کاربر/تغییر وضعیت آگهی/...) روی یک رکورد مشخص از جداول کاربری
// عمل نمی‌کند، بلکه یک اقدام سطحِ کل-سیستم است. برای رعایت `target_id not null` (ستون uuid)،
// شناسه‌ی خودِ ادمین انجام‌دهنده‌ی اقدام به‌عنوان target_id ثبت می‌شود.
//
// طراحی عمدی: این تابع هرگز خطا throw نمی‌کند و مقدار بازگشتی‌اش استفاده نمی‌شود. اگر ثبت لاگ به
// هر دلیلی (مثلاً قطعی موقت دیتابیس) شکست بخورد، نباید اقدام اصلی ادمین (که قبلاً با موفقیت انجام
// شده) از دید کاربر شکست‌خورده به‌نظر برسد؛ فقط خطا در کنسول سرور ثبت می‌شود. لاگ‌ها ابزار پیگیری و
// شفافیت‌اند (بند ۷ سند راهبردی)، نه بخشی از مسیر بحرانی خودِ عملیات.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

// انواع هدف قابل‌ثبت — پنج مقدار اولیه‌ی تسک‌های ۲/۳/۵ همین فاز، به‌علاوه‌ی "system" که تسک ۸
// (دکمه‌ی بک‌آپ) اضافه کرد.
export type AdminLogTargetType =
  | "user"
  | "listing"
  | "real_estate"
  | "driver"
  | "service_provider"
  | "system";

export async function logAdminAction(params: {
  adminId: string;
  targetType: AdminLogTargetType;
  targetId: string;
  action: string;
}): Promise<void> {
  const { error } = await supabaseAdminClient.from("admin_logs").insert({
    admin_id: params.adminId,
    target_type: params.targetType,
    target_id: params.targetId,
    action: params.action,
  });

  if (error) {
    // عمداً throw نمی‌شود — رجوع کنید به یادداشت طراحی بالای فایل.
    console.error("logAdminAction: ثبت لاگ ادمین ناموفق بود", error);
  }
}