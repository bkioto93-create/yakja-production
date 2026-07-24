// مسیر فایل: src/components/ui/Spinner.tsx
// **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** پیش‌تر aria-label و متن sr-only این کامپوننت به‌صورت
// انگلیسی و هاردکد بودند («loading» / «Loading...»)؛ این متن گرچه بصری نیست، توسط صفحه‌خوان‌ها
// برای کاربران کم‌بینا خوانده می‌شود و طبق الزام قطعی ۲ سند راهبردی («تحت هیچ شرایطی، هیچ کلمه
// یا متن نباید مستقیماً... تایپ شود» — بدون استثنا برای متون دسترسی‌پذیری) باید از دیکشنری بیاید.
// چون Spinner یک کامپوننت پایه‌ی مشترک است و مستقیماً به dict دسترسی ندارد، اکنون یک prop
// اختیاری `label` می‌گیرد؛ فراخوان‌هایی که به dict دسترسی دارند (مثل ویزاردهای ثبت آگهی/ملک،
// پروفایل راننده/متخصص) باید `label={dict.common.loading}` را پاس بدهند. اگر label داده نشود
// (مثلاً استفاده‌ی داخلی و عمومی این کامپوننت در src/components/ui/Button.tsx که هیچ آگاهی از
// زبان/دیکشنری ندارد)، هیچ متنی رندر نمی‌شود — این حالت به رندر یک متن انگلیسی هاردکد در میان
// یک رابط کاملاً دوزبانه (دری/پشتو) ترجیح داده شد.
export function Spinner({ className = "", label }: { className?: string; label?: string }) {
  return (
    <div
      className={`animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-primary rounded-full ${className}`}
      role="status"
      aria-label={label || undefined}
    >
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

