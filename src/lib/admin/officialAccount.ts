// مسیر فایل: src/lib/admin/officialAccount.ts
// شناسه‌ی «حساب رسمی مدیریت یکجا» — همیشه «قدیمی‌ترین ردیف با role='admin'» در نظر گرفته
// می‌شود؛ دقیقاً همان قاعده‌ای که src/lib/chat/adminSupportChat.ts برای «صاحبِ صندوق پشتیبانی»
// از قبل استفاده می‌کند (getSupportAdminId). این فایل به‌عنوان یک منبع مشترک و مستقل (بدون
// وابستگی به دامنه‌ی چت) اضافه شد تا قابلیت‌های دیگر — مثل «سنجاق‌شدنِ استوریِ مدیریت در صدر
// ردیف استوری‌ها» — هم بتوانند بدون وابستگیِ چرخه‌ای/نامرتبط به فایل چت، از همین قاعده استفاده
// کنند. اگر بعداً خواستی، می‌توانی adminSupportChat.ts را هم به فراخوانیِ همین تابع ریفکتور
// کنی؛ فعلاً برای کمترین ریسک، آن فایل دست‌نخورده ماند و این یک کپیِ کوچکِ عمدیِ همان کوئری است.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

// عمداً بدون کش‌کردن نتیجه بین درخواست‌ها: این مقدار پایه‌ی تصمیم‌های نمایشی حساسی (مثل اینکه
// کدام استوری «رسمی» است) قرار می‌گیرد، پس صحتِ همیشگی مهم‌تر از صرفه‌جویی در یک کوئری سبک است.
export async function getOfficialAdminId(): Promise<string | null> {
  const { data } = await supabaseAdminClient
    .from("users")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}