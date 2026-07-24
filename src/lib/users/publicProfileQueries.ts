// مسیر فایل: src/lib/users/publicProfileQueries.ts
// تکمیل گذشته‌نگر تسک ۳ فاز ۰۶ — لایه‌ی خواندن داده برای صفحه‌ی عمومی «پروفایل کاربر»
// (src/app/[lang]/users/[id]/page.tsx). پیش از این فایل، هیچ صفحه‌ی عمومی نمایش پروفایل کاربر
// دیگر در اپ وجود نداشت (رجوع کنید به یادداشت محدودیت شفاف‌شده‌ی تسک ۳ در
// YAKJA_PHASE_06_REPORTS.md)؛ همین فایل + صفحه‌ی همراهش، آن محدودیت را برطرف می‌کند و امکان اتصال
// دکمه‌ی «گزارش تخلف» (target_type = user) را کامل می‌کند.
//
// طراحی عمدی: این پروفایل صرفاً «عمومی» است — یعنی فقط ستون‌های امن برای نمایش به هر بازدیدکننده
// (id، name، created_at) از جدول users خوانده می‌شود؛ هرگز phone_number یا role در اینجا
// برگردانده نمی‌شود (برخلاف SessionUser در src/lib/auth/session.ts که برای خودِ کاربر است، نه
// بازدیدکننده‌ی دیگر) — دقیقاً هم‌راستا با بند حریم خصوصی سند راهبردی.
//
// چون جدول users هیچ Policy عمومی/anon ندارد (دقیقاً مثل reports)، این کوئری هم از
// supabaseAdminClient استفاده می‌کند، نه کلاینت مرورگر.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type PublicUserProfile = {
  id: string;
  name: string | null;
  memberSinceYear: number;
  listingsCount: number;
  realEstateCount: number;
};

// خواندن پروفایل عمومیِ یک کاربر برای صفحه‌ی src/app/[lang]/users/[id]/page.tsx.
// اگر کاربر وجود نداشت یا مسدود (is_blocked) بود، null برمی‌گردد — دقیقاً هم‌الگو با قاعده‌ی
// «Public فقط موجودیت تاییدشده/فعال را می‌بیند» که در ماژول‌های دیگر (listings/drivers/...)
// دنبال شده؛ نمایش عمومی پروفایل یک حساب مسدودشده منطقی نیست.
export async function getPublicUserProfile(id: string): Promise<PublicUserProfile | null> {
  const { data: user, error } = await supabaseAdminClient
    .from("users")
    .select("id, name, created_at, is_blocked")
    .eq("id", id)
    .maybeSingle();

  if (error || !user || user.is_blocked) return null;

  // دو شمارشِ سبک (count-only، بدون خواندن ردیف‌ها) برای «آگهی‌های فعال این کاربر» — فقط
  // آگهی‌های status='approved' شمرده می‌شوند، دقیقاً هم‌قاعده‌ی صفحه‌ی جزئیات هر آگهی.
  const [listingsResult, realEstateResult] = await Promise.all([
    supabaseAdminClient
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id)
      .eq("status", "approved"),
    supabaseAdminClient
      .from("real_estate")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id)
      .eq("status", "approved"),
  ]);

  return {
    id: user.id,
    name: user.name,
    memberSinceYear: new Date(user.created_at as string).getFullYear(),
    listingsCount: listingsResult.count ?? 0,
    realEstateCount: realEstateResult.count ?? 0,
  };
}