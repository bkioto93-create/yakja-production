"use client";
// مسیر فایل: src/app/[lang]/HomeFaq.tsx
// تسک بازطراحی صفحه‌ی اصلی — بخش «پرسش‌های پرتکرار» که کارفرما درخواست کرده بود.
// تنها بخش از کل بازطراحی صفحه‌ی اصلی که واقعاً به تعامل کاربر (باز/بسته کردن هر پرسش) نیاز
// دارد، برای همین‌جا مجبور به "use client" شدیم؛ همه‌ی بخش‌های دیگر (Hero، بنرها، ویژگی‌ها) عمداً
// Server Component باقی ماندند تا حجم جاوااسکریپت ارسالی به مرورگر — به‌خصوص برای کاربرانی با
// اینترنت ضعیف — تا حد ممکن کم بماند.
import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { Card } from "@/components/ui/Card";

type FaqDict = {
  title: string;
  subtitle: string;
  q1: string;
  a1: string;
  q2: string;
  a2: string;
  q3: string;
  a3: string;
  q4: string;
  a4: string;
  q5: string;
  a5: string;
  q6: string;
  a6: string;
};

export function HomeFaq({ dict }: { dict: FaqDict }) {
  const items = [
    { q: dict.q1, a: dict.a1 },
    { q: dict.q2, a: dict.a2 },
    { q: dict.q3, a: dict.a3 },
    { q: dict.q4, a: dict.a4 },
    { q: dict.q5, a: dict.a5 },
    { q: dict.q6, a: dict.a6 },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section>
      <div className="text-center mb-5 px-4 md:px-0">
        <h2 className="font-extrabold text-xl md:text-2xl text-text-main">{dict.title}</h2>
        <p className="text-sm text-text-muted mt-1">{dict.subtitle}</p>
      </div>

      <div className="flex flex-col gap-2 px-4 md:px-0 max-w-2xl mx-auto">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <Card key={item.q} className="p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-4 min-h-[52px] text-start font-bold text-text-main"
              >
                <span>{item.q}</span>
                <Icons.ChevronDown
                  className={`w-5 h-5 shrink-0 text-text-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm text-text-muted leading-relaxed">{item.a}</p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
