// مسیر فایل: src/components/province/ProvincePickerModal.tsx
// فاز ۱۰ — مودال مشترک انتخاب ولایت. طبق بند «سادگی حداکثری برای کاربران کم‌تجربه» و «اولویت
// تصویر/لمس بر منوی کشویی طولانی» سند راهبردی، به‌جای یک <select> ساده با ۳۴ گزینه‌ی متنی (که
// روی گوشی‌های ساده و برای کاربران کم‌تجربه دیدن/لمس‌کردنش سخت است)، یک فهرست تمام‌صفحه با سه لایه
// طراحی شده: ۱) جستجوی متنی سریع، ۲) ۵ ولایت پرکاربرد به‌صورت چیپ‌های بزرگ و یک‌لمسی (بدون نیاز به
// اسکرول برای اکثر کاربران)، ۳) فهرست کامل الفبایی/منطقه‌ای برای بقیه.
//
// این کامپوننت عمداً کاملاً «کور به کوکی» است — فقط value/onSelect/onClose می‌گیرد و به بیرون
// اطلاع می‌دهد؛ خودِ نوشتن کوکی (برای سوییچر سراسری) یا نوشتن state فرم (برای فیلد ثبت آگهی) به
// عهده‌ی کامپوننت والد است. همین باعث شد یک کامپوننت واحد برای هر دو مصرف کاملاً متفاوت
// (ProvinceBar سراسری در لایه‌ی مشترک صفحه، و ProvinceSelectField داخل فرم‌های ثبت/ویرایش) کافی
// باشد، بدون تکرار کد فهرست/جستجو/چیپ.
//
// allowAll: فقط سوییچر سراسری (ProvinceBar) گزینه‌ی «همه‌ی افغانستان» را نشان می‌دهد؛ فرم‌های ثبت
// آگهی/پروفایل هرگز این گزینه را نمی‌گیرند چون هر آگهی باید دقیقاً به یک ولایت مشخص تعلق داشته
// باشد — «همه‌ی افغانستان» فقط یک حالت *نمایش/فیلتر* برای بازدیدکننده است، نه یک ولایت واقعی.
"use client";

import { useMemo, useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { Input } from "@/components/ui/Input";
import { PROVINCES, POPULAR_PROVINCE_IDS, type ProvinceId } from "@/lib/provinces";
import { ALL_PROVINCES_VALUE } from "@/lib/province/constants";

export type ProvinceDict = {
  title: string;
  searchPlaceholder: string;
  popularLabel: string;
  allLabel: string;
  allProvincesOption: string;
  noResultsText: string;
  // رفع باگ (پس از تحویل اولیه‌ی فاز ۱۰): این ۳ فیلد در دیکشنری (fa.ts/ps.ts) از اول وجود
  // داشتند و در کامپوننت‌ها هم استفاده می‌شدند، اما این تایپ هنگام نوشتن اولیه از قلم افتاده
  // بودند — همین باعث خطای TypeScript "Property 'resultsForLabel' does not exist" می‌شد.
  fieldLabel: string;
  fieldError: string;
  resultsForLabel: string;
  names: Record<string, string>;
};

export function ProvincePickerModal({
  value,
  allowAll,
  dict,
  onSelect,
  onClose,
}: {
  value: string | null;
  allowAll: boolean;
  dict: ProvinceDict;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [searchText, setSearchText] = useState("");

  const filteredProvinces = useMemo(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return PROVINCES;
    return PROVINCES.filter((p) => dict.names[p.dictKey]?.includes(trimmed));
  }, [searchText, dict.names]);

  const showPopularRow = searchText.trim().length === 0;

  return (
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
        {/* هدر ثابت */}
        <div className="flex items-center justify-between gap-3 p-5 pb-3 shrink-0 border-b border-slate-100">
          <h2 className="font-extrabold text-text-main text-lg">{dict.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.allLabel}
            className="w-9 h-9 rounded-full bg-slate-100 text-text-muted flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 flex flex-col gap-4">
          {/* جستجوی متنی سریع */}
          <div className="relative pt-3">
            <Icons.Search className="w-5 h-5 text-text-muted absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="pr-11"
            />
          </div>

          {/* گزینه‌ی «همه‌ی افغانستان» — فقط سوییچر سراسری */}
          {allowAll && (
            <button
              type="button"
              onClick={() => onSelect(ALL_PROVINCES_VALUE)}
              className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 font-extrabold transition-all active:scale-[0.98] ${
                value === null
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 text-text-main"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icons.MapPin className="w-5 h-5" />
                {dict.allProvincesOption}
              </span>
              {value === null && <Icons.CheckCircle className="w-5 h-5" />}
            </button>
          )}

          {/* ۵ ولایت پرکاربرد — چیپ‌های بزرگ یک‌لمسی، فقط وقتی جستجویی در جریان نیست */}
          {showPopularRow && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-text-muted">{dict.popularLabel}</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_PROVINCE_IDS.map((id) => {
                  const isActive = value === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelect(id)}
                      className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors active:scale-95 ${
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-text-main border-slate-200"
                      }`}
                    >
                      {dict.names[id]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* فهرست کامل ۳۴ ولایت */}
          <div className="flex flex-col gap-1">
            {filteredProvinces.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">{dict.noResultsText}</p>
            ) : (
              filteredProvinces.map((p) => {
                const isActive = value === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98] ${
                      isActive ? "bg-primary/10 text-primary font-extrabold" : "text-text-main hover:bg-slate-50"
                    }`}
                  >
                    {dict.names[p.dictKey]}
                    {isActive && <Icons.CheckCircle className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ProvinceId };