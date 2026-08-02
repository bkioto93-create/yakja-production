// مسیر فایل: src/app/sitemap.ts
// نقشه‌ی سایت (sitemap.xml) — Next.js این فایل را خودکار شناسایی می‌کند و در آدرس
// https://yakja.top/sitemap.xml سرو می‌کند؛ هیچ فایل route.ts یا XML دستی لازم نیست.
//
// چون سایت دوزبانه است (دری/پشتو، هر دو زیر پیشوند [lang])، هر صفحه دو بار — یک‌بار برای هر
// زبان — با ارجاع دوطرفه‌ی hreflang (alternates.languages) اضافه می‌شود؛ این دقیقاً همان روشی
// است که گوگل برای فهمیدن «این دو آدرس دو نسخه‌ی زبانی یک صفحه‌اند، نه دو صفحه‌ی جدا» توصیه
// می‌کند — بدون آن، ریسک واقعی «محتوای تکراری» بین دو زبان وجود دارد.
//
// صفحات خصوصی/کاربرمحور (admin, auth, profile, chat, report/new, listings/new, real-estate/new,
// services/provider, transport/driver) عمداً اینجا نیستند — نه ارزش SEOای دارند (محتوای عمومی
// نیستند یا پشت ورود کاربرند) و نه باید در نتایج گوگل ظاهر شوند؛ همین صفحات در src/app/robots.ts
// هم صریحاً از خزیدن (crawl) مسدود شده‌اند.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/siteUrl";
import { LOCALES } from "@/lib/i18n/constants";
import {
  getApprovedListingIdsForSitemap,
  getApprovedRealEstateIdsForSitemap,
} from "@/lib/seo/sitemapQueries";

// مسیرهای ثابتِ عمومی — دقیقاً همان صفحاتی که بدون ورود، برای هر بازدیدکننده (و هر ربات) در
// دسترس‌اند. ترتیب بر اساس اهمیت نسبی (priority) پایین‌تر انتخاب شده.
const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/listings", priority: 0.9, changeFrequency: "hourly" },
  { path: "/real-estate", priority: 0.9, changeFrequency: "hourly" },
  { path: "/services", priority: 0.8, changeFrequency: "hourly" },
  { path: "/transport", priority: 0.8, changeFrequency: "hourly" },
  { path: "/vip", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
];

function languageAlternatesFor(path: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of STATIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: languageAlternatesFor(path) },
      });
    }
  }

  // آگهی‌های کالای تاییدشده — هر آگهی، برای هر دو زبان، با تاریخ واقعیِ ثبتش.
  const listings = await getApprovedListingIdsForSitemap();
  for (const row of listings) {
    const path = `/listings/${row.id}`;
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(row.createdAt),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: languageAlternatesFor(path) },
      });
    }
  }

  // آگهی‌های ملکِ تاییدشده — همان الگو.
  const realEstate = await getApprovedRealEstateIdsForSitemap();
  for (const row of realEstate) {
    const path = `/real-estate/${row.id}`;
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(row.createdAt),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: languageAlternatesFor(path) },
      });
    }
  }

  return entries;
}