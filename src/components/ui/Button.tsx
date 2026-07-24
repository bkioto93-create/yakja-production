// مسیر فایل: src/components/ui/Button.tsx
// کامپوننت دکمه کاملا Touch-Targeting سازگار (دسترسی موبایلی حداقل 48px فضا برای کوری کاربرِ دارای موبایل کوچیکتر)
//
// **به‌روزرسانی تسک ۶ فاز ۰۸ («صیقل نهایی ظاهر اپ‌گونه — دکمه‌های بزرگ و فاصله‌دار»):**
// ۱) حداقل ارتفاع از ۴۸ به ۵۲ پیکسل و فاصله‌ی داخلی افقی/عمودی کمی افزایش یافت — طبق بند ۲ سند
//    راهبردی («دکمه‌های بزرگ و فاصله‌دار، برای جلوگیری از خطای لمس روی گوشی‌های کوچک»). ۴۸ پیکسل
//    از قبل حداقل استاندارد دسترسی‌پذیری بود؛ ۵۲ پیکسل همان حداقل را حفظ می‌کند و علاوه بر آن حس
//    «اپ‌گونه و راحت‌تر» ایجاد می‌کند، بدون اینکه در هیچ‌جای پروژه به یک دکمه‌ی کوچک‌تر از حد لازم
//    نیاز بوده باشد.
// ۲) یک حلقه‌ی تمرکز (focus-visible ring) اضافه شد — فقط هنگام ناوبری با صفحه‌کلید نمایان می‌شود
//    (نه با لمس/کلیک ماوس)، برای دسترسی‌پذیری بهتر بدون هیچ تغییر ظاهری در حالت عادی.
// ۳) `-webkit-tap-highlight-color` سراسری (globals.css، همین تسک) اکنون هایلایت خاکستری پیش‌فرض
//    مرورگر روی این دکمه را هم حذف می‌کند؛ افکت لمس همچنان از طریق `active:scale-95` موجود دیده
//    می‌شود.
// هیچ prop، رفتار یا امضای کامپوننت تغییر نکرد — کاملاً سازگار با تمام استفاده‌های موجود در پروژه.
"use client";
import React from "react";
import { Spinner } from "./Spinner";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
  loading?: boolean;
  // **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** prop اختیاری جدید — اگر صفحه‌ی فراخوان به dict دسترسی
  // دارد، باید dict.common.loading را اینجا پاس بدهد تا هنگام loading=true، Spinner داخلی یک
  // متن دسترسی‌پذیری (aria-label/sr-only) درست و دوزبانه داشته باشد، نه بدون متن. اگر پاس داده
  // نشود، رفتار قبلی حفظ می‌شود (بدون متن دسترسی‌پذیری) — هیچ فراخوان موجودی نمی‌شکند.
  loadingLabel?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = "primary", fullWidth, loading, loadingLabel, className = "", disabled, ...props },
    ref
  ) => {
    let classes =
      "flex justify-center items-center rounded-2xl min-h-[52px] px-7 py-3 font-bold transition-all text-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ";

    switch (variant) {
      case "primary":
        classes += "bg-primary hover:bg-primary-dark text-white active:scale-95 shadow-md shadow-primary/20 ";
        break;
      case "secondary":
        classes += "bg-accent hover:bg-accent-dark text-white active:scale-95 shadow-md shadow-accent/20 ";
        break;
      case "outline":
        classes += "bg-transparent border-2 border-primary text-primary active:scale-95 hover:bg-primary/5 ";
        break;
    }

    if (fullWidth) classes += "w-full ";
    if (disabled || loading) classes += "opacity-60 cursor-not-allowed active:scale-100 ";

    return (
      <button ref={ref} className={classes + className} disabled={disabled || loading} {...props}>
        {loading ? (
          <Spinner className="w-5 h-5 text-current border-[3px]" label={loadingLabel} />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

