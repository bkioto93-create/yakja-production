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
// **رفع باگ (طرح شکسته — عکس از پشت حلقه بیرون می‌زد و مرکز نبود):** آواتار داخلی هم‌زمان کلاس
// `w-full h-full` و یک style درون‌خطی `{width: size, height: size}` داشت. چون style درون‌خطی
// همیشه روی کلاس CSS اولویت دارد، آواتار به‌جای پرشدنِ فضای واقعیِ باقی‌مانده (بعد از کسرشدنِ
// ضخامت حلقه + فاصله‌ی سفید از size)، همیشه دقیقاً به اندازه‌ی کامل size رندر می‌شد — یعنی از
// فضای تنگ‌تر خودش بیرون می‌زد و حلقه/فاصله‌ی سفید اطرافش را می‌پوشاند، دقیقاً همان چیزی که در
// عکس‌های واقعی دیده شد. رفع شد با حذف آن style اضافه (فقط className تعیین‌کننده‌ی اندازه باقی
// ماند) + افزودن overflow-hidden به هر سه لایه‌ی تودرتو (نه فقط لایه‌ی آخر) به‌عنوان یک محافظ
// دوم، تا حتی اگر در آینده باز چنین ناسازگاری‌ای رخ داد، هرگز از مرز دایره‌ی خودش بیرون نزند.
//
// **افزوده‌شده (سنجاق‌شدنِ استوریِ مدیریت):** یک variant تازه («official») + یک badge اختیاری
// اضافه شد تا استوریِ حساب رسمی مدیریت یکجا، همان‌جا در ردیف، از استوریِ کاربرهای عادی بصراً
// متمایز باشد — بدون این‌که این کامپوننت هیچ منطق تجاری‌ای درباره‌ی «کیست ادمین» بداند؛ تصمیم
// «این استوری رسمی است یا نه» همیشه بیرون از این فایل (StoriesShowcase.tsx و مشابه) گرفته
// می‌شود، اینجا فقط رنگ/نشان متفاوت رندر می‌شود.
"use client";

import type { ReactNode } from "react";

export function StoryRing({
  hasActiveStory,
  onClick,
  size = 64,
  children,
  ariaLabel,
  variant = "default",
  badge,
}: {
  hasActiveStory: boolean;
  onClick?: () => void;
  size?: number;
  children: ReactNode;
  ariaLabel?: string;
  // "official" فقط برای سنجاق‌شدنِ استوریِ حساب رسمی مدیریت یکجا استفاده می‌شود — گرادیانی
  // متمایز از حلقه‌ی معمولی (طلایی/زمردی به‌جای کهربایی/صورتی/بنفش).
  variant?: "default" | "official";
  // یک نشانِ کوچکِ اختیاری (مثلاً تیکِ آبی) که گوشه‌ی پایین‌راستِ حلقه رندر می‌شود.
  badge?: ReactNode;
}) {
  // ضخامت حلقه‌ی گرادیانی و فاصله‌ی سفید بین حلقه و آواتار، هردو نسبت به اندازه‌ی کلی محاسبه
  // می‌شوند تا در اندازه‌های مختلف (کوچک/بزرگ) همیشه تناسب بصری درستی داشته باشد.
  const ringThickness = Math.max(2, Math.round(size * 0.045));
  const gapThickness = Math.max(2, Math.round(size * 0.035));

  const ringGradientClassName =
    variant === "official"
      ? "bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-600"
      : "bg-gradient-to-tr from-amber-400 via-pink-500 to-fuchsia-600";

  // آواتار داخلی دیگر هیچ اندازه‌ی درون‌خطی مستقل ندارد — همیشه دقیقاً همان فضایی را پر می‌کند
  // که والدش (لایه‌ی فاصله‌ی سفید، یا مستقیم اندازه‌ی کامل وقتی حلقه نیست) در اختیارش می‌گذارد.
  const avatar = (
    <div className="rounded-full overflow-hidden w-full h-full">{children}</div>
  );

  const content = hasActiveStory ? (
    <div
      className={`rounded-full overflow-hidden ${ringGradientClassName}`}
      style={{ width: size, height: size, padding: ringThickness }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden bg-white"
        style={{ padding: gapThickness }}
      >
        {avatar}
      </div>
    </div>
  ) : (
    <div className="rounded-full overflow-hidden" style={{ width: size, height: size }}>
      {avatar}
    </div>
  );

  // بدنه‌ی مشترکِ «حلقه + نشانِ گوشه‌ی اختیاری» — چه دکمه باشد چه نباشد.
  const contentWithBadge = badge ? (
    <div className="relative" style={{ width: size, height: size }}>
      {content}
      <div className="absolute -bottom-0.5 -left-0.5 pointer-events-none">{badge}</div>
    </div>
  ) : (
    content
  );

  if (!onClick) return contentWithBadge;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative active:scale-95 transition-transform shrink-0"
      style={{ width: size, height: size }}
    >
      {content}
      {badge && <div className="absolute -bottom-0.5 -left-0.5 pointer-events-none">{badge}</div>}
    </button>
  );
}