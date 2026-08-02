// مسیر فایل: src/app/robots.ts
// robots.txt — Next.js این فایل را خودکار شناسایی می‌کند و در آدرس https://yakja.top/robots.txt
// سرو می‌کند؛ هیچ فایل دستی در public/ لازم نیست.
//
// دو گروه قانون تعریف شده:
// ۱) «*» — همه‌ی ربات‌ها (گوگل، بینگ، و هر ربات دیگر)، اجازه‌ی خزیدن کامل سایت را دارند، به‌جز
//    مسیرهای خصوصی/پشت-ورود که در disallow زیر فهرست شده‌اند.
// ۲) فهرست صریح ربات‌های هوش مصنوعی (GPTBot از OpenAI، ClaudeBot از Anthropic، PerplexityBot،
//    Google-Extended که جدا از خودِ Googlebot است، و…) — طبق درخواست صریح اینکه سایت برای هوش‌های
//    مصنوعی هم قابل‌خواندن باشد، این‌ها را جداگانه و صریح «اجازه» می‌دهیم (نه فقط به‌طور ضمنی زیر
//    «*»)، تا هیچ ابهامی درباره‌ی نیت سایت نباشد.
//
// **راهنمای تغییر بعدی (بدون نیاز به دانستن برنامه‌نویسی):** اگر روزی خواستی یک ربات خاص
// (مثلاً یک ربات هوش مصنوعی جدید) را هم صریحاً اجازه بدهی، فقط نامش را به آرایه‌ی AI_CRAWLERS
// پایین اضافه کن. اگر خواستی یکی از آن‌ها را مسدود کنی، نامش را از آرایه حذف کن — آن ربات همچنان
// زیر قانون عمومی «*» (اجازه) باقی می‌ماند مگر آن‌که صریحاً به لیست disallow زیر اضافه‌اش کنی.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/siteUrl";

// مسیرهای خصوصی/کاربرمحور — همان فهرستی که در src/app/sitemap.ts هم عمداً نادیده گرفته شده.
// الگوی «/*/admin» یعنی این قاعده زیر هر پیشوند زبانی (fa یا ps) هم اعمال می‌شود.
const DISALLOWED_PATHS = [
  "/*/admin",
  "/*/auth",
  "/*/profile",
  "/*/chat",
  "/*/report/new",
  "/*/listings/new",
  "/*/real-estate/new",
  "/*/services/provider",
  "/*/transport/driver",
  "/*/users/",
  "/api/",
  "/select-language",
];

const AI_CRAWLERS = [
  "GPTBot", // OpenAI
  "ChatGPT-User", // OpenAI (اکشن‌های زنده‌ی ChatGPT)
  "OAI-SearchBot", // OpenAI (جستجو)
  "ClaudeBot", // Anthropic
  "Claude-Web", // Anthropic
  "anthropic-ai", // Anthropic
  "PerplexityBot", // Perplexity
  "Google-Extended", // آموزش هوش مصنوعی گوگل (جدا از خودِ Googlebot که همیشه مجاز است)
  "Bingbot", // مایکروسافت/Copilot
  "Amazonbot",
  "Applebot-Extended",
  "CCBot", // Common Crawl — منبع داده‌ی بسیاری از مدل‌های هوش مصنوعی
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}