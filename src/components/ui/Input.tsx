// مسیر فایل: src/components/ui/Input.tsx
// **به‌روزرسانی تسک ۶ فاز ۰۸ («صیقل نهایی ظاهر اپ‌گونه — لبه‌های نرم و گرد»):** گردی لبه از
// `rounded-xl` به `rounded-2xl` تغییر کرد تا دقیقاً با گردیِ Button.tsx/Card.tsx هم‌راستا باشد؛
// این تنها کامپوننت پایه‌ای بود که گردی متفاوتی داشت. ارتفاع (`min-h-[52px]`) از قبل هم‌سو با
// اندازه‌ی جدید Button بود، پس نیازی به تغییر نداشت. هیچ prop یا رفتاری تغییر نکرد.
"use client";
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const generatedId = React.useId();
    const defaultId = id || generatedId;

    return (
      <div className="w-full mb-4">
        {label && (
          <label htmlFor={defaultId} className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
            {label}
          </label>
        )}
        <input
          id={defaultId}
          ref={ref}
          className={`block w-full min-h-[52px] bg-bg-base border ${
            error ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-primary"
          } text-text-main rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-text-muted ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-sm mt-1 mr-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";