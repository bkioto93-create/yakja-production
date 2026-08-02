// مسیر فایل: src/components/seo/StructuredData.tsx
// داده‌ی ساخت‌یافته‌ی JSON-LD (schema.org) — علاوه بر robots.txt/sitemap.xml/llms.txt، این یکی
// مستقیماً داخل HTML هر صفحه قرار می‌گیرد و به‌طور خلاصه به گوگل و سیستم‌های هوش مصنوعی می‌گوید
// «این سایت چیست، اسمش چیست، آدرسش چیست» — دقیقاً همان قالبی که گوگل برای Rich Results و اکثر
// ابزارهای خزنده‌ی هوش مصنوعی برای فهم سریع یک سایت استفاده می‌کنند.
//
// عمداً به‌عنوان یک کامپوننت سرور جدا (نه مستقیم در layout.tsx) نگه داشته شده تا اگر در آینده
// نیاز به داده‌ی ساخت‌یافته‌ی بیشتر (مثلاً BreadcrumbList در صفحات جزئیات آگهی) بود، همین الگو
// تکرار شود، بدون شلوغ‌کردن خودِ layout.tsx.
import { SITE_URL } from "@/lib/config/siteUrl";
import faDictionary from "@/dictionaries/fa";

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Yakja",
        alternateName: "یکجا",
        url: SITE_URL,
        logo: `${SITE_URL}/icons/yakja-icon-512.png`,
      },
      {
        "@type": "WebSite",
        name: "Yakja",
        alternateName: "یکجا",
        url: SITE_URL,
        description: faDictionary.meta.description,
        inLanguage: ["fa", "ps"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // این تنها استفاده‌ی مجاز dangerouslySetInnerHTML برای این نوع تگ است — طبق مستندات خودِ
      // Next.js برای افزودن JSON-LD؛ چون محتوا یک شیء ثابت و داخلی است (نه ورودی کاربر)، خطر
      // XSS ندارد.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}