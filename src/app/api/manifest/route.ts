// مسیر فایل: src/app/api/manifest/route.ts
//
// **تایید/تکمیل تسک ۵ فاز ۰۸:** طبق شرط شروع فاز، سند راهبردی (بند ۱.۳ «هویت بصری اپ‌گونه» و
// بند ۳ «زبان پلتفرم و RTL») دوباره مرور شد. مانیفست پویا از قبل به‌درستی بر اساس پارامتر lang
// (خوانده‌شده در src/app/[lang]/layout.tsx → `manifest: /api/manifest?lang=${lang}`) عنوان و
// توضیح صحیح هر دو زبان را برمی‌گرداند (dict.meta.title/description در fa.ts و ps.ts هر دو
// کامل و ترجمه‌شده‌اند). ست آیکون‌ها (۶۴/۱۹۲/۵۱۲ + نسخه‌ی ۱۰۲۴ برای اپل، از طریق
// generateMetadata همان لایه) با فایل‌های واقعی موجود در public/icons مطابقت کامل دارد.
//
// **یافته‌ی این تسک:** آبجکت مانیفست فاقد فیلدهای `lang`/`dir` بود. طبق مشخصات استاندارد Web App
// Manifest، این دو فیلد به مرورگر/سیستم‌عامل می‌گویند نام و توضیح اپ (که همین‌جا تولید می‌شوند)
// باید با چه جهتی نمایش داده شوند — دقیقاً همان الزام RTL بند ۳ سند راهبردی، این‌بار در سطح
// مانیفست نصب (نه فقط تگ <html>). بدون این دو فیلد، برخی صفحه‌های نصب/میان‌بر سیستم‌عامل ممکن
// بود عنوان دوزبانه‌ی اپ را چپ‌به‌راست نمایش دهند. اضافه شدند؛ هیچ فیلد دیگری از مانیفست تغییر
// نکرد (icons/start_url/display/رنگ‌ها همگی از قبل صحیح بودند و دست‌نخورده ماندند).
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
    theme_color: "#171717",
    icons: [
      { src: "/icons/yakja-icon-64.png", sizes: "64x64", type: "image/png" },
      { src: "/icons/yakja-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/yakja-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };

  return NextResponse.json(manifest);
}