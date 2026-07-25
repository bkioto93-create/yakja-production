// مسیر فایل: src/components/ui/Spinner.tsx
// اسپینر یکپارچه‌ی کل اپ — یک حلقه‌ی چرخان با CSS خالص (بدون SVG یا وابستگی بیرونی)، که از قبل
// در چند نقطه‌ی پروژه (Button.tsx و ویزاردهای ثبت آگهی/ملک/راننده/ارائه‌دهنده‌ی خدمات) استفاده
// می‌شده. رنگش از currentColor می‌آید (با کلاس‌هایی مثل text-white / text-primary قابل تغییره).
//
// prop اختیاری label برای دسترسی‌پذیری است: چون خود اسپینر فقط یک شکل چرخانِ بی‌متن است، بدون
// label یک کاربر با صفحه‌خوان اصلاً متوجه نمی‌شود «در حال بارگذاری» است — این متن با sr-only فقط
// برای صفحه‌خوان خوانده می‌شود و در ظاهر دیده نمی‌شود.
export function Spinner({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <span
        className={`animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-primary rounded-full ${className}`}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}