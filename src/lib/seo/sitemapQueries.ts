// مسیر فایل: src/lib/seo/sitemapQueries.ts
// لایه‌ی خواندنِ سبک و اختصاصی src/app/sitemap.ts — عمداً از src/lib/marketplace/queries.ts و
// src/lib/realEstate/queries.ts جدا نگه داشته شد چون اینجا فقط دو ستون (id, created_at) لازم
// است، نه شکل کامل جزئیات هر آگهی؛ یک select سبک روی جدول، نه صدازدن تابع Postgres کامل.
//
// فقط آگهی‌های «تاییدشده» (status='approved') برگردانده می‌شوند — دقیقاً همان شرطی که سیاست
// عمومی RLS هر دو جدول از قبل اعمال می‌کند (رجوع کنید به YAKJA_DATABASE_LOG.md)، تا نقشه‌ی سایت
// هرگز آگهی در انتظار تایید یا حذف‌شده را به گوگل معرفی نکند.
//
// سقف ۵۰۰۰ ردیف برای هر جدول: هم یک عدد امن و متداول برای اندازه‌ی یک فایل sitemap.xml است، هم
// از کند شدن بیش‌ازحد ساخت نقشه‌ی سایت در سایت‌های بسیار پرآگهی جلوگیری می‌کند. اگر تعداد آگهی‌های
// تاییدشده در آینده از این عدد فراتر رفت، باید به «نقشه‌ی سایتِ چندفایلی» (sitemap index) مهاجرت
// شود — امکانی که خودِ Next.js با generateSitemaps پشتیبانی می‌کند.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type SitemapRow = { id: string; createdAt: string };

const SITEMAP_ROW_LIMIT = 5000;

export async function getApprovedListingIdsForSitemap(): Promise<SitemapRow[]> {
  const { data, error } = await supabaseAdminClient
    .from("listings")
    .select("id, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(SITEMAP_ROW_LIMIT);

  if (error || !data) return [];
  return data.map((row) => ({ id: row.id as string, createdAt: row.created_at as string }));
}

export async function getApprovedRealEstateIdsForSitemap(): Promise<SitemapRow[]> {
  const { data, error } = await supabaseAdminClient
    .from("real_estate")
    .select("id, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(SITEMAP_ROW_LIMIT);

  if (error || !data) return [];
  return data.map((row) => ({ id: row.id as string, createdAt: row.created_at as string }));
}