// مسیر فایل: src/components/ui/Spinner.tsx
// اسپینر یکپارچه‌ی کل اپ. عمداً به هیچ آیکون یا فایل دیگری وابسته نیست (فقط یک SVG خام) تا با
// خیال راحت هرجای پروژه — داخل دکمه‌ها، صفحات لودینگ، هرجای دیگر — بدون ریسکِ به‌هم‌خوردنِ
// importها استفاده شود. رنگش از currentColor می‌آید، یعنی با کلاس‌های text-white / text-primary
// و... به‌راحتی رنگش عوض می‌شود.
export function Spinner({
  size = 20,
  strokeWidth = 3,
  className = "",
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`animate-spin shrink-0 ${className}`}
      role="status"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeOpacity="0.18"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}