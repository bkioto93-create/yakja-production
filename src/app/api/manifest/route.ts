// مسیر فایل: src/app/api/manifest/route.ts
//
// **تایید/تکمیل تسک ۵ فاز ۰۸:** طبق شرط شروع فاز، سند راهبردی (بند ۱.۳ «هویت بصری اپ‌گونه» و
// بند ۳ «زبان پلتفرم و RTL») دوباره مرور شد. مانیفست پویا از قبل به‌درستی بر اساس پارامتر lang
// (خوانده‌شده در src/app/[lang]/layout.tsx → `manifest: /api/manifest?lang=${lang}`) عنوان و
// توضیح صحیح هر دو زبان را برمی‌گرداند (dict.meta.title/description در fa.ts و ps.ts هر دو
// کامل و ترجمه‌شده‌اند). ست آیکون‌ها (۶۴/۱۹۲/۵۱۲ + نسخه‌ی ۱۰۲۴ برای اپل، از طریق
// generateMetadata همان لایه) با فایل‌های واقعی موجود در public/icons مطابقت کامل دارد.
//
// **رفع باگ (۲۰۲۶-۰۷-۲۶) — بک‌گراند مشکی هنگام بالا آمدن اپ نصب‌شده:**
// آیکون ۵۱۲ پیکسلی قبلاً هم‌زمان `"purpose": "any maskable"` داشت. طبق توصیه‌ی رسمی خودِ Chrome/
// web.dev، ترکیب این دو مقصود در یک آیکون فقط زمانی امن است که آن تصویر مخصوص حالت maskable
// طراحی شده باشد (لوگو با یک حاشیه‌ی امن داخل بوم کشیده شده باشد تا وقتی اندروید آن را داخل یک
// شکل دیگر (دایره/مربع‌گرد) «ماسک» می‌کند، چیزی از لوگو یا بک‌گراندش قطع نشود). آیکون فعلی برای
// حالت عادی (`any`) طراحی شده، نه maskable؛ وقتی اندروید همان فایل را به‌عنوان maskable هم
// می‌خواند، طبق مشخصات، لوگو را بیشتر جمع/برش می‌زند و ناحیه‌ی اضافه‌شده را — چون در بک‌گراند
// اصلی/زیبای خودِ لوگو تعریف نشده — با رنگ پیش‌فرض سیستم (معمولاً مشکی) پر می‌کند؛ دقیقاً همان
// چیزی که در اسپلش‌اسکرین دیده می‌شد. راه‌حل: `purpose` فقط `"any"` شد تا اندروید/مرورگر همان
// تصویر اصلی را دقیقاً همان‌طور که هست (با همان بک‌گراند خوشگل خودش) نشان دهد، بدون هیچ
// ماسک/برش اضافه.
//
// همچنین `theme_color` از `#171717` (تقریباً مشکی) به `#ffffff` تغییر کرد تا با `background_color`
// همین مانیفست و با `viewport.themeColor` در src/app/layout.tsx (که از قبل `#ffffff` بود) یکدست
// شود — دیگر هیچ رنگ نزدیک‌به‌مشکی در هیچ بخشی از هویت بصری PWA باقی نماند.
import { NextResponse } from 'next/server';
import { getDictionary } from '@/dictionaries/getDictionary';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'fa';

  // استفاده از تابع مرکزی
  const dict = await getDictionary(lang);

  const manifest = {
    name: dict.meta.title,
    short_name: "یکجا",
    description: dict.meta.description,
    lang,
    dir: "rtl",
    start_url: `/${lang}`,
    scope: `/${lang}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/yakja-icon-64.png", sizes: "64x64", type: "image/png" },
      { src: "/icons/yakja-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/yakja-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };

  return NextResponse.json(manifest);
}