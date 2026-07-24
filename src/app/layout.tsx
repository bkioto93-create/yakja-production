// مسیر فایل: src/app/layout.tsx
// پیش از این، تگ‌های <html>/<body> فقط داخل src/app/[lang]/layout.tsx بودند
// که فقط مسیرهای زیر /[lang]/... را پوشش می‌داد و تا وقتی همه‌ی مسیرهای پروژه زیر [lang] بودند
// مشکلی هم ایجاد نمی‌کرد. اما با اضافه‌شدن src/app/select-language (یک مسیر هم‌سطح و بیرون از
// [lang]، چون آنجا هنوز زبان کاربر مشخص نیست)، Next.js به یک ریشه‌ی واقعی در بالای کل درخت
// app/ نیاز دارد. این فایل همان ریشه است؛ [lang]/layout.tsx دیگر <html>/<body> را تکرار نمی‌کند.
//
// **به‌روزرسانی تسک ۲ فاز ۰۸ (Service Worker):** افزودن <ServiceWorkerRegister /> در پایین
// body — دقیقاً هم‌سطح با سایر کامپوننت‌های فقط-اثر-جانبیِ این لایه. اینجا (نه در
// [lang]/layout.tsx) قرار گرفت چون Service Worker باید یک‌بار برای کل اپ (مستقل از زبان)
// ثبت شود، نه یک‌بار به‌ازای هر زبان.
//
// **به‌روزرسانی تسک ۶ فاز ۰۸ («صیقل نهایی ظاهر اپ‌گونه»):** افزودن `viewportFit: "cover"` به
// آبجکت viewport. بدون این مقدار، مقادیر `env(safe-area-inset-*)` که در همین تسک برای رفع باگ
// نبودِ فاصله‌ی ایمن منوی ناوبری پایین (BottomNav.tsx) در globals.css تعریف شدند، روی سافاری
// iOS همیشه صفر می‌ماندند و هیچ اثری نداشتند — چون بدون `viewport-fit=cover`، مرورگر اصلاً ناحیه‌ی
// زیر Safe Area را به صفحه نمی‌دهد تا این متغیرها معنا پیدا کنند. این تغییر پیش‌نیاز فنیِ مستقیم
// و ضروریِ رفع همان باگ است، نه یک تغییر مستقل.
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import faDictionary from "@/dictionaries/fa";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  display: "swap",
});

// **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** این متادیتای ریشه پیش‌تر عنوان/توضیح را به‌صورت جمله‌ی
// کامل دری، مستقیم و هاردکد در همین فایل نگه می‌داشت. این لایه بالاتر از [lang] است و برای
// مسیرهایی مثل src/app/select-language (که هنوز زبان کاربر مشخص نیست) استفاده می‌شود؛ هر مسیر
// زیر src/app/[lang]/... این مقدار را با generateMetadata خودش (بر پایه‌ی dict.meta همان زبان)
// بازنویسی می‌کند، پس این‌جا صرفاً یک fallback است. برای رفع هاردکد بودن، متن اکنون مستقیماً از
// دیکشنری دری (fa.ts) خوانده می‌شود — دری چون طبق بند ۳ سند راهبردی، زبان پیش‌فرض پروژه (همان
// چیزی که src/proxy.ts هم پیش از انتخاب زبان به آن هدایت می‌کند) است؛ به این ترتیب دیگر هیچ متن
// تکراری/مستقلی در دو جای مختلف پروژه نگهداری نمی‌شود.
export const metadata: Metadata = {
  title: faDictionary.meta.title,
  description: faDictionary.meta.description,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // dir="rtl" برای هر دو زبان دری و پشتو صحیح است. ویژگی lang دقیق (fa/ps) توسط
  // src/components/layout/LangHtmlSync.tsx در سمت کلاینت روی همین تگ ست می‌شود،
  // چون خودِ این لایه از params.lang بی‌خبر است (بالاتر از [lang] قرار دارد).
  return (
    <html dir="rtl" className="h-full antialiased">
      <body className={`${vazirmatn.className} bg-bg-base text-text-main h-full`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

