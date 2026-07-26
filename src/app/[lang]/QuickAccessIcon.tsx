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
import { useState } from "react";
import type { Icons } from "@/components/ui/Icons";

export function QuickAccessIcon({
  src,
  fallbackIcon: FallbackIcon,
  fallbackClassName,
}: {
  src: string;
  fallbackIcon: (typeof Icons)[keyof typeof Icons];
  fallbackClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return <FallbackIcon className={fallbackClassName} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="w-full h-full object-contain"
      onError={() => setImageFailed(true)}
    />
  );
}