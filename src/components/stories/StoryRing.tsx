// مسیر فایل: src/components/stories/StoryRing.tsx
// قابلیت استوری — کامپوننت خالصِ نمایشی (بدون هیچ منطق دیتا/فچ) که یک حلقه‌ی رنگی گرادیانی
// (دقیقاً به الگوی استوری اینستاگرام) دور هر محتوایی (آواتار/آیکون) می‌کشد، فقط اگر
// hasActiveStory=true باشد. طراحی‌شده تا در آینده دور آواتار هر جای دیگری از اپ (کارت آگهی،
// کارت راننده/متخصص و ...) هم بدون تغییر قابل استفاده باشد — همین یک کامپوننت، فقط با props
// متفاوت.
//
// اندازه با یک عدد پیکسلی (size) کنترل می‌شود، نه کلاس‌های از‌پیش‌تعریف‌شده‌ی Tailwind — چون
// جاهای مختلف اپ آواتارهایی با اندازه‌ی متفاوت دارند (۶۴px در کارت هویت پروفایل، ۶۰px در ردیف
// صفحه‌ی اصلی و ...) و یک اندازه‌ی واحد کافی نیست.
"use client";

import type { ReactNode } from "react";

export function StoryRing({
  hasActiveStory,
  onClick,
  size = 64,
  children,
  ariaLabel,
}: {
  hasActiveStory: boolean;
  onClick?: () => void;
  size?: number;
  children: ReactNode;
  ariaLabel?: string;
}) {
  // ضخامت حلقه‌ی گرادیانی و فاصله‌ی سفید بین حلقه و آواتار، هردو نسبت به اندازه‌ی کلی محاسبه
  // می‌شوند تا در اندازه‌های مختلف (کوچک/بزرگ) همیشه تناسب بصری درستی داشته باشد.
  const ringThickness = Math.max(2, Math.round(size * 0.045));
  const gapThickness = Math.max(2, Math.round(size * 0.035));

  const avatar = (
    <div
      className="rounded-full overflow-hidden w-full h-full"
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );

  const content = hasActiveStory ? (
    <div
      className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-fuchsia-600"
      style={{ width: size, height: size, padding: ringThickness }}
    >
      <div className="w-full h-full rounded-full bg-white" style={{ padding: gapThickness }}>
        {avatar}
      </div>
    </div>
  ) : (
    <div style={{ width: size, height: size }}>{avatar}</div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="rounded-full active:scale-95 transition-transform shrink-0"
      style={{ width: size, height: size }}
    >
      {content}
    </button>
  );
}