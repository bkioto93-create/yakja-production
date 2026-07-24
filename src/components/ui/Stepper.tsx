// مسیر فایل: src/components/ui/Stepper.tsx
// هدایت‌کننده‌یِ جریانات آگهی بدون دلسرد کردن کاربران
// **افزوده‌شده در تسک ۴ فاز ۰۲:** پرام اختیاری busy — وقتی true باشد (مثلاً حین فشرده‌سازی تصویر
// یا حین ارسال نهایی فرم به سرور)، هر دو دکمه غیرفعال می‌شوند و روی دکمه‌ی آخر (Submit) اسپینر
// نمایش داده می‌شود؛ پیش‌فرض false است تا رفتار قبلیِ هر مصرف‌کننده‌ی احتمالی بدون تغییر بماند.
//
// **به‌روزرسانی تسک ۶ فاز ۰۸ («صیقل نهایی ظاهر اپ‌گونه — دکمه‌های بزرگ و فاصله‌دار»):** فاصله‌ی
// افقی بین دکمه‌ی «قبلی» و دکمه‌ی «بعدی/ثبت» از `space-x-4` به `space-x-5` افزایش یافت — چون خودِ
// دکمه‌ها (Button.tsx، همین تسک) بزرگ‌تر شدند، فاصله‌ی کمی بیشتر بین‌شان از فشردگی بصری جلوگیری
// می‌کند. هیچ منطق یا رفتار دیگری تغییر نکرد.
"use client";
import React from "react";
import { Button } from "./Button";

export function Stepper({
  currentStep,
  totalSteps,
  children,
  onNext,
  onBack,
  texts,
  busy = false,
}: {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  texts: { next: string; back: string; submit: string; stepOf: string };
  busy?: boolean;
}) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;
  // بدون هیچ متن هاردکد — طبق الزام قطعی ۲، از کلید dict.common.stepOf خوانده می‌شود
  const stepLabel = texts.stepOf
    .replace("{current}", String(currentStep))
    .replace("{total}", String(totalSteps));

  return (
    <div className="flex flex-col w-full h-full min-h-[50vh] bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      {/* Header نوار راهنما خطی بالا */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-text-main opacity-70">
          {stepLabel}
        </span>
        <div className="flex flex-1 mx-4 space-x-2 space-x-reverse h-2 bg-slate-100 rounded-full overflow-hidden">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                index + 1 <= currentStep ? "bg-primary" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Container در بر گیرنده‌ی صفحه ماژول به خودِ Stepper متکی است */}
      <div className="flex-1 overflow-auto animate-fade-in py-2">
        {children}
      </div>

      {/* کنترلهاي دکمه هاي کف قالب Wizard فرم */}
      <div className="mt-8 flex items-center justify-between space-x-5 space-x-reverse pt-4 border-t border-slate-100">
        {!isFirst ? (
          <Button variant="outline" className="flex-1 max-w-[45%]" onClick={onBack} disabled={busy}>
            {texts.back}
          </Button>
        ) : <div className="flex-1" />}
        <Button
          className="flex-1"
          variant="primary"
          onClick={onNext}
          disabled={busy}
          loading={isLast && busy}
        >
          {isLast ? texts.submit : texts.next}
        </Button>
      </div>
    </div>
  );
}