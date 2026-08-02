// مسیر فایل: src/lib/config/siteUrl.ts
// تک‌نقطه‌ی تنظیم آدرس اصلی سایت — برای sitemap.xml، robots.txt، متادیتای Open Graph/hreflang
// و هر جای دیگری که آدرس کامل (نه نسبی) سایت لازم است.
//
// **راهنمای تغییر بعدی (بدون نیاز به دانستن برنامه‌نویسی):**
// این مقدار از متغیر محیطی NEXT_PUBLIC_SITE_URL خوانده می‌شود (اگر در تنظیمات پروژه روی Vercel،
// بخش Settings → Environment Variables، مقداری برایش گذاشته باشی)؛ در غیر این صورت به‌صورت
// پیش‌فرض روی دامنه‌ی رسمی «https://yakja.top» (طبق YAKJA_DEPLOYMENT.md) برمی‌گردد. یعنی وقتی
// دامنه به‌درستی وصل شد نیازی به تغییر هیچ کدی نیست؛ فقط اگر روزی دامنه عوض شد، کافی است مقدار
// NEXT_PUBLIC_SITE_URL را در Vercel به‌روزرسانی کنی و دوباره Deploy کنی.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://yakja.top").replace(/\/$/, "");