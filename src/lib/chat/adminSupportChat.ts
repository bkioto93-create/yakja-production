// مسیر فایل: src/lib/chat/adminSupportChat.ts
// فاز ۱۳ — قابلیت «چت با مدیر/پشتیبانی». این فایل فقط یک مسئولیت دارد: پیدا کردن شناسه‌ی
// حساب ادمینی که باید owner_id همه‌ی گفتگوهای «پشتیبانی» باشد.
//
// چون طبق معماری فعلی پروژه (src/lib/auth/adminPassword.ts و اسکریپت
// scripts/hash-admin-password.mjs) معمولاً فقط یک حساب ادمین ساخته می‌شود، «قدیمی‌ترین ردیف با
// role='admin'» به‌عنوان صاحبِ ثابتِ صندوق پشتیبانی در نظر گرفته شده — نه یک مقدار هاردکدشده در
// کد، بلکه همیشه مستقیم از خودِ دیتابیس خوانده می‌شود. اگر بعداً چند حساب ادمین ساخته شد، همه‌ی
// آن‌ها همچنان می‌توانند از پنل مدیریت (/admin/chats) درخواست‌ها را ببینند و تایید/رد کنند —
// فقط صاحبِ رسمیِ ردیف گفتگو (owner_id) همیشه همین یک حساب می‌ماند.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export const ADMIN_SUPPORT_CONTEXT_TYPE = "admin_support" as const;

// عمداً بدون کش‌کردن نتیجه بین درخواست‌ها: چون این مقدار مستقیماً روی «صاحبِ» یک ردیف حساس
// (owner_id) اثر می‌گذارد، صحت همیشگی مهم‌تر از صرفه‌جویی در یک کوئری سبک است.
export async function getSupportAdminId(): Promise<string | null> {
  const { data } = await supabaseAdminClient
    .from("users")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}