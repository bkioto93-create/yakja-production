// مسیر فایل: src/components/ui/IconCategoryPicker.tsx
// انتخابگر ایزوله و مستقلِ آیکون‌ها در فُرم ها جهت تعهد کامل پروژه به ماژولار بودن UI / اولویت آیکون به متن کشویی در UX ضعیفان نت
"use client";
import React from "react";
import { Card } from "./Card";

type OptionType = { id: string; label: string; icon: React.ReactNode };

export function IconCategoryPicker({ 
  options, value, onChange 
}: { 
  options: OptionType[]; value: string; onChange: (val: string) => void 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {options.map((opt) => (
        <Card 
          key={opt.id} 
          onClick={() => onChange(opt.id)}
          className={`p-4 flex flex-col items-center justify-center min-h-[120px] ${
            value === opt.id ? 'border-2 border-primary bg-primary/5 shadow-md shadow-primary/10' : 'opacity-80'
          }`}
        >
          <div className={`${value === opt.id ? 'text-primary scale-110 transition-transform' : 'text-slate-500'}`}>
            {opt.icon}
          </div>
          <span className={`mt-3 text-center text-sm font-bold ${
            value === opt.id ? 'text-primary' : 'text-text-main'
          }`}>
            {opt.label}
          </span>
        </Card>
      ))}
    </div>
  );
}