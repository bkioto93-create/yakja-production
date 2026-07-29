// مسیر فایل: src/components/province/ProvinceSelectField.tsx
// فاز ۱۰ — فیلد انتخاب ولایت برای فرم‌های ثبت/ویرایش (آگهی کالا، پروفایل راننده، پروفایل متخصص،
// آگهی ملک). دقیقاً همان ProvincePickerModal مشترک را با allowAll=false باز می‌کند (چون یک آگهی
// باید دقیقاً به یک ولایت مشخص تعلق داشته باشد، نه «همه‌ی افغانستان») — این‌بار state انتخاب‌شده
// در همان فرم والد نگه‌داری می‌شود (نه کوکی)، دقیقاً مثل بقیه‌ی فیلدهای هر فرم (title/price/...).
"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { ProvincePickerModal, type ProvinceDict } from "./ProvincePickerModal";

export function ProvinceSelectField({
  value,
  onChange,
  dict,
  label,
  error,
}: {
  value: string | null;
  onChange: (id: string) => void;
  dict: ProvinceDict;
  label: string;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const displayLabel = value ? dict.names[value] : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-text-main">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 text-right transition-colors ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      >
        <span className={`font-semibold ${displayLabel ? "text-text-main" : "text-text-muted"}`}>
          {displayLabel ?? dict.title}
        </span>
        <Icons.ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
      </button>
      {error && <span className="text-xs font-semibold text-red-500">{error}</span>}

      {isOpen && (
        <ProvincePickerModal
          value={value}
          allowAll={false}
          dict={dict}
          onSelect={(id) => {
            onChange(id);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}