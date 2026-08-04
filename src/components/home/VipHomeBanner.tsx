// مسیر فایل: src/components/home/VipHomeBanner.tsx
// ارتقای بصری: طراحی پریمیوم و لوکس با استفاده از گرادیان‌های شعاعی عمیق طلایی،
// افکت‌های شیشه‌ای (Glassmorphism) روی دکمه و المان‌ها، و میکرو-انیمیشن‌های نوری.
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

type VipHomeBannerDict = {
  title: string;
  subtitle: string;
  videoLabel: string;
  postsLabel: string;
  chatLabel: string;
  button: string;
};

export function VipHomeBanner({ lang, dict }: { lang: string; dict: VipHomeBannerDict }) {
  const benefits = [
    { label: dict.videoLabel, icon: Icons.Camera },
    { label: dict.postsLabel, icon: Icons.Box },
    { label: dict.chatLabel, icon: Icons.MessageSquare },
  ];

  return (
    <Link
      href={`/${lang}/vip`}
      className="block relative isolate overflow-hidden rounded-[32px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300 via-amber-500 to-orange-600 text-white px-6 py-8 md:px-10 md:py-10 shadow-xl shadow-amber-500/20 active:scale-[0.98] md:hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* دایره‌های نوری متحرک و محو در پس‌زمینه */}
      <div className="absolute -top-20 -left-10 w-[220px] h-[220px] bg-white opacity-[0.12] rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -right-12 w-[200px] h-[200px] bg-white opacity-[0.1] rounded-full blur-xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-right gap-2 md:flex-1">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] mb-1">
            <CheckBadgeIcon className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
          </div>
          <h2 className="text-xl md:text-3xl font-black leading-tight drop-shadow-md tracking-tight">
            {dict.title}
          </h2>
          <p className="text-sm md:text-base font-semibold opacity-90 drop-shadow-sm max-w-[280px] md:max-w-none">
            {dict.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-1 w-full mt-2 md:mt-0">
          {benefits.map((benefit) => (
            <div
              key={benefit.label}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-[14px] px-4 py-3 hover:bg-white/15 transition-colors"
            >
              <benefit.icon className="w-5 h-5 shrink-0 text-amber-100" />
              <span className="text-sm font-extrabold tracking-wide drop-shadow-sm">{benefit.label}</span>
            </div>
          ))}
          <span className="mt-2 flex items-center justify-center gap-2 bg-white text-amber-600 rounded-[14px] px-4 py-3.5 font-black text-sm w-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:bg-amber-50 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all">
            {dict.button}
            <Icons.ArrowRight className="w-4 h-4 rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}