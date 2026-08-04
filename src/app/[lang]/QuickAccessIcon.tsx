"use client";
// مسیر فایل: src/app/[lang]/QuickAccessIcon.tsx
// تسک تبدیل آیکون‌های «دسترسی سریع» از حالت کلاسیک ساده به تصاویر کاوایی/کیوت سه‌بعدی.
//
// چرا Client Component و چرا onError؟ چون فایل‌های تصویر (PNG) هنوز توسط کارفرما تولید و اضافه
// نشده‌اند (پرامپت‌ها و مسیر دقیق در فایل راهنما آمده)، اگر مستقیم <img src="..."> می‌گذاشتیم و
// فایل موجود نبود، دقیقاً همان باگ «ناپدید شدن آیکون بنر اسپلیت» تکرار می‌شد — این‌بار برای
// مهم‌ترین بخش ناوبری صفحه‌ی اصلی (دسترسی سریع)، که خیلی حساس‌تر است. برای همین این کامپوننت
// ابتدا تصویر سفارشی را امتحان می‌کند و اگر لود نشد (onError)، خودکار و بی‌صدا به همان آیکون
// کلاسیک قبلی (خط‌محور) برمی‌گردد — یعنی صفحه هیچ‌وقت با یک جای خالی/خراب دیده نمی‌شود، چه
// تصاویر جدید اضافه شده باشند چه نه.
//
// **رفع باگ دیپلوی (۲۰۲۶-۰۷-۲۶):** قبلاً این کامپوننت خودِ تابعِ آیکون (مثلاً Icons.Box) را
// به‌عنوان prop از یک Server Component (page.tsx) می‌گرفت. در Next.js نمی‌شود یک تابع را از
// Server Component به Client Component پاس داد چون قابل سریالایز نیست؛ نتیجه‌اش خطای
// "Functions cannot be passed directly to Client Components" روی Vercel بود. حالا به‌جای خودِ
// تابع، فقط اسمِ آیکون (یک رشته‌ی ساده مثل "Box") پاس داده می‌شود و خودِ این فایل — که سمت
// کلاینت است — آن اسم را از روی آبجکت Icons پیدا می‌کند.
import { useState } from "react";
import { Icons } from "@/components/ui/Icons";

export function QuickAccessIcon({
  src,
  fallbackIconName,
  fallbackClassName,
}: {
  src: string;
  fallbackIconName: keyof typeof Icons;
  fallbackClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const FallbackIcon = Icons[fallbackIconName];

  if (imageFailed) {
    return <FallbackIcon className={fallbackClassName} />;
  }

  return (
    // **رفع باگ مرکزیت (درخواست کارفرما: «همین که عرض زیادتر می‌شود، آیکون‌ها از مرکز کارت خارج
    // می‌شوند و به یک طرف کشیده می‌شوند»):** علتش یک هکِ قدیمی بود — کلاس `translate-x-[4%]` که
    // تصویر را همیشه ۴٪ از عرضِ خودش به یک سمت هُل می‌داد. چون این ۴٪ نسبت به عرضِ تصویر است و
    // تصویر با بزرگ‌ترشدن کارت بزرگ‌تر می‌شود، مقدارِ جابه‌جایی هم به‌صورت تصاعدی زیادتر می‌شد:
    // روی موبایل چند پیکسل (تقریباً نامحسوس) ولی روی نمایشگرهای عریض کاملاً چشمگیر و کج.
    // آن هک حالا کاملاً حذف شده و تصویر با object-contain دقیقاً در مرکزِ ریاضیِ کادر خودش
    // می‌نشیند — در هر عرضی، بدون استثنا.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="block w-full h-full object-contain object-center"
      onError={() => setImageFailed(true)}
    />
  );
}