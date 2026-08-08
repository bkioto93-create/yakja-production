// مسیر فایل: src/components/home/VipHomeBanner.tsx
// فاز ۱۱ — بنر VIP صفحه‌ی اصلی (بند ۷ پرامپت VIP). دقیقاً هم‌سبک بنر هیرو موجود در
// src/app/[lang]/page.tsx (گرادیان، گوشه‌های گرد، دایره‌های تزئینی محو در پس‌زمینه)، اما با
// گرادیان طلایی/کهربایی به‌جای آبی primary — تا از نظر بصری از هیرو اصلی متمایز باشد و حس
// «ویژه/پرمیوم» بدهد. هم در موبایل (چیدمان عمودی) هم در دسکتاپ (چیدمان افقی اسپلیت) تست‌شده.
//
// **به‌روزرسانی (شفافیتِ مزیتِ استوریِ VIP):** طبق تصمیم صریح کارفرما — «نباید این تغییر را
// بدون اطلاع‌رسانی انجام دهیم» — یک ردیفِ چهارمِ مزیت اضافه شد: استوریِ اختصاصی تا ۳۰ ثانیه
// (دو برابرِ سقفِ ۱۵ ثانیه‌ایِ کاربر معمولی).
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

type VipHomeBannerDict = {
  title: string;
  subtitle: string;
  videoLabel: string;
  postsLabel: string;
  chatLabel: string;
  storyLabel: string;
  button: string;
};

export function VipHomeBanner({ lang, dict }: { lang: string; dict: VipHomeBannerDict }) {
  const benefits = [
    { label: dict.videoLabel, icon: Icons.Camera },
    { label: dict.postsLabel, icon: Icons.Box },
    { label: dict.chatLabel, icon: Icons.MessageSquare },
    { label: dict.storyLabel, icon: Icons.Clock },
  ];

  return (
    <Link
      href={`/${lang}/vip`}
      className="block relative isolate overflow-hidden rounded-[32px] bg-gradient-to-l from-amber-500 to-amber-400 text-white px-6 py-7 md:px-10 md:py-10 shadow-lg shadow-amber-200/60 active:scale-[0.99] md:hover:-translate-y-0.5 transition-transform"
    >
      <div className="absolute -top-16 -left-10 w-[180px] h-[180px] bg-white opacity-[0.08] rounded-full blur-[2px] z-0" />
      <div className="absolute -bottom-14 -right-8 w-[160px] h-[160px] bg-white opacity-[0.08] rounded-full blur-[2px] z-0" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-right gap-2 md:flex-1">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <CheckBadgeIcon className="w-8 h-8 md:w-9 md:h-9" />
          </div>
          <h2 className="text-lg md:text-2xl font-extrabold leading-snug drop-shadow-sm">
            {dict.title}
          </h2>
          <p className="text-sm md:text-base font-semibold opacity-95">{dict.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2.5 md:flex-1 w-full">
          {benefits.map((benefit) => (
            <div
              key={benefit.label}
              className="flex items-center gap-2.5 bg-white/10 rounded-2xl px-3.5 py-2.5"
            >
              <benefit.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="text-xs md:text-sm font-bold">{benefit.label}</span>
            </div>
          ))}
          <span className="mt-1 inline-flex items-center justify-center gap-1.5 bg-white text-amber-600 rounded-2xl px-4 py-2.5 font-extrabold text-sm w-full">
            {dict.button}
          </span>
        </div>
      </div>
    </Link>
  );
}