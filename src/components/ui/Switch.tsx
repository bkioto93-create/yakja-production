// مسیر فایل: src/components/ui/Switch.tsx
// تسک ۵ فاز ۰۳ — کامپوننت عمومی و مستقلِ سوییچ (روشن/خاموش)، اولین بار در این پروژه ساخته شد
// (تا این تسک، هیچ سوییچی در هیچ ماژولی لازم نبود). هم‌سبک با Button.tsx: بدون وابستگی بیرونی،
// active:scale برای بازخورد لمسی، و حداقل ابعاد لمسی مناسب موبایل.
// عمداً از Flexbox (justify-start/justify-end) برای جابه‌جایی دسته‌ی سوییچ استفاده شد، نه
// translate-x دستی؛ چون جهت RTL/LTR به‌صورت بومی توسط مرورگر بر اساس ویژگی dir روی <html>
// مدیریت می‌شود (کل اپ همیشه dir="rtl" است — بند مربوطه در src/app/layout.tsx) و نیازی به
// کلاس‌های rtl: جداگانه نیست.
"use client";
import React from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
};

export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex items-center w-14 h-8 min-h-[32px] rounded-full px-1 shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        checked ? "bg-primary justify-end" : "bg-slate-300 justify-start"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
    >
      <span className="w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200" />
    </button>
  );
}