// مسیر فایل: src/app/[lang]/HeroIllustration.tsx
// بروزرسانی (۲۰۲۶-۰۷-۲۶): آیکون قبلی یک SVG خطی (ساخته‌شده با کد) بود. حالا کارفرما یک تصویر
// PNG سفارشی طراحی کرده و در public/images/hero-icon.png گذاشته و فایل SVG قدیمی را هم حذف
// کرده، پس این کامپوننت به‌جای رسم SVG، همان تصویر PNG جدید را نمایش می‌دهد.
//
// این کامپوننت همچنان Server Component ساده باقی می‌ماند (بدون "use client")، چون فقط یک
// <img> ساده است و نیازی به state/تعامل ندارد.
export function HeroIllustration({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/hero-icon.png"
      alt=""
      className={`object-contain ${className ?? ""}`}
    />
  );
}