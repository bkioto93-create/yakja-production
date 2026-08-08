// مسیر فایل: src/components/home/VipPitchSection.tsx
// بخش ترغیبی «چرا VIP نتیجه‌ی بهتری می‌آورد؟» — قبلاً فقط داخل src/app/[lang]/vip/page.tsx
// بود؛ طبق درخواست صریح کارفرما («خیلی تاکید می‌کند روی این‌که به مشتری‌ها نشان بدهیم VIP چه
// خاصیت‌هایی دارد») حالا به یک کامپوننت مستقل منتقل شد تا هم در صفحه‌ی VIP و هم در صفحه‌ی اصلی
// (جایی که بیشترین بازدید را دارد) بدون تکرار کد نمایش داده شود.
//
// هر سه امتیاز (مشتری بیشتر/دیده‌شدن بیشتر/فروش سریع‌تر) به امتیازهای واقعیِ VIP وصل‌اند
// (آگهی/چت نامحدود، ویدئو، نشان VIP)، نه یک وعده‌ی انتزاعی؛ عمداً هیچ ادعای اضافه‌ای (مثل
// «اولویت در نتایج جستجو») که در کد واقعی پیاده‌سازی نشده، اینجا گفته نمی‌شود.
//
// **به‌روزرسانی (شفافیتِ مزیتِ استوریِ VIP):** یک آیتمِ چهارم («استوری‌ات کامل‌تر دیده می‌شود»)
// اضافه شد — طبق همان اصلِ بالا، به یک قابلیتِ واقعیِ تازه (سقفِ ۳۰ثانیه‌ایِ ویدئوی استوری برای
// VIP، در برابرِ ۱۵ ثانیه‌ی کاربر معمولی) وصل است، نه یک وعده‌ی انتزاعی.
//
// ctaHref/ctaLabel اختیاری‌اند: صفحه‌ی VIP (که خودِ کاربر همین‌جاست) این‌ها را پاس نمی‌دهد؛
// صفحه‌ی اصلی پاس می‌دهد تا یک دکمه‌ی «عضویت VIP» زیر کارت باشد و مسیر بعدی کاربر مشخص باشد.
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export type VipPitchDict = {
  title: string;
  items: { title: string; desc: string }[];
  realEstateNoteLabel: string;
  realEstateNote: string;
};

export function VipPitchSection({
  dict,
  ctaHref,
  ctaLabel,
}: {
  dict: VipPitchDict;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-[26px] border border-amber-100 bg-gradient-to-b from-amber-50/70 to-white p-4 md:p-5 flex flex-col gap-4">
      <h2 className="font-extrabold text-text-main text-sm text-center">{dict.title}</h2>

      <div className="flex flex-col gap-3">
        {dict.items.map((item, index) => {
          const PitchIcon =
            [Icons.Users, Icons.Search, Icons.CheckCircle, Icons.Clock][index] ?? Icons.CheckCircle;
          return (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <PitchIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-text-main text-sm">{item.title}</span>
                <span className="text-xs text-text-muted leading-relaxed">{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* یادآوریِ مخصوصِ بخش املاک — طبق درخواست صریح کارفرما. */}
      <div className="rounded-2xl bg-white border border-amber-100 p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icons.Home className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-text-main text-xs">{dict.realEstateNoteLabel}</span>
          <span className="text-xs text-text-muted leading-relaxed mt-0.5">
            {dict.realEstateNote}
          </span>
        </div>
      </div>

      {/* دکمه‌ی اختیاریِ «عضویت VIP» — فقط وقتی این بخش جایی غیر از خودِ صفحه‌ی VIP نمایش داده
          می‌شود (مثلاً صفحه‌ی اصلی) معنا دارد؛ صفحه‌ی VIP خودش چون از قبل فرم/دکمه‌ی خرید را
          پایین‌تر دارد، این prop را پاس نمی‌دهد. */}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-sm font-extrabold h-11 active:scale-95 md:hover:bg-amber-600 transition-all"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}