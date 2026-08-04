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
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** مقدار تازه‌ی "vip_request" اضافه شد — برای اقدام تایید/رد
// یک درخواست VIP در بخش تازه‌ی پنل مدیریت (src/app/[lang]/admin/(protected)/vip/actions.ts).
// طبق یادداشت قبلی همین فایل، ستون `admin_logs.target_type` از ابتدا بدون CHECK constraint
// دیتابیسی تعریف شده بود، پس این مقدار تازه بدون هیچ migration اضافه‌ای هم‌اکنون قابل‌درج است —
// فقط همین یونیون تایپ‌اسکریپتی به‌روزرسانی شد.
//
// **به‌روزرسانی فاز ۱۳ (چت با مدیر/پشتیبانی):** مقدار تازه‌ی "conversation" اضافه شد — برای اقدام
// تایید/رد یک درخواست چت پشتیبانی در src/app/[lang]/admin/(protected)/chats/actions.ts. دقیقاً
// طبق همان توضیح بالا، چون این ستون بدون CHECK constraint است، هیچ migration جداگانه‌ای لازم نشد.
//
// طراحی عمدی: این تابع هرگز خطا throw نمی‌کند و مقدار بازگشتی‌اش استفاده نمی‌شود. اگر ثبت لاگ به
// هر دلیلی (مثلاً قطعی موقت دیتابیس) شکست بخورد، نباید اقدام اصلی ادمین (که قبلاً با موفقیت انجام
// شده) از دید کاربر شکست‌خورده به‌نظر برسد؛ فقط خطا در کنسول سرور ثبت می‌شود. لاگ‌ها ابزار پیگیری و
// شفافیت‌اند (بند ۷ سند راهبردی)، نه بخشی از مسیر بحرانی خودِ عملیات.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

// انواع هدف قابل‌ثبت — پنج مقدار اولیه‌ی تسک‌های ۲/۳/۵ فاز ۰۷، به‌علاوه‌ی "system" (تسک ۸ فاز ۰۷،
// دکمه‌ی بک‌آپ)، "vip_request" (فاز ۱۱، تایید/رد درخواست VIP) و "conversation" (فاز ۱۳، تایید/رد
// درخواست چت پشتیبانی).
// **به‌روزرسانی — گردش تایید عکس پروفایل:** مقدار تازه‌ی "user_photo" اضافه شد — برای اقدام
// تایید/رد عکس پروفایل یک کاربر در src/app/[lang]/admin/(protected)/users/photoActions.ts.
// طبق یادداشت بالا، چون ستون target_type بدون CHECK constraint دیتابیسی است، این مقدار تازه
// بدون هیچ migration اضافه‌ای هم‌اکنون قابل‌درج است — فقط همین یونیون تایپ‌اسکریپتی به‌روزرسانی شد.
export type AdminLogTargetType =
  | "user"
  | "listing"
  | "real_estate"
  | "driver"
  | "service_provider"
  | "system"
  | "vip_request"
  | "conversation"
  | "user_photo";

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