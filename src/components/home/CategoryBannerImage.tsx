"use client";
// مسیر فایل: src/components/home/CategoryBannerImage.tsx
// بنرهای اسپلیت بالای هر دسته‌بندی — دقیقاً هم‌الگو با src/app/[lang]/QuickAccessIcon.tsx: چون
// فایل‌های عکس بنر را کارفرما بعداً و مستقیم در پوشه‌ی public اضافه می‌کند، اگر مستقیم
// <img src="..."> می‌گذاشتیم و فایل هنوز موجود نبود، همان باگ «آیکون/بنر ناپدید» تکرار می‌شد.
// این کامپوننت (سمت کلاینت، چون به state نیاز دارد) ابتدا عکس واقعی را امتحان می‌کند و اگر لود
// نشد (onError)، خودکار و بی‌صدا به یک پس‌زمینه‌ی رنگی + آیکون همان دسته برمی‌گردد — یعنی تا
// وقتی عکس واقعی آپلود نشده، بنر هرگز با یک جای خالی/شکسته دیده نمی‌شود.
import { useState } from "react";
import { Icons } from "@/components/ui/Icons";

export function CategoryBannerImage({
  src,
  fallbackIconName,
  fallbackWrapperClassName,
}: {
  src: string;
  fallbackIconName: keyof typeof Icons;
  fallbackWrapperClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const FallbackIcon = Icons[fallbackIconName];

  if (imageFailed) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${fallbackWrapperClassName}`}>
        <FallbackIcon className="w-10 h-10 md:w-14 md:h-14" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover"
      onError={() => setImageFailed(true)}
    />
  );
}