// مسیر فایل: src/components/home/CategoryBanner.tsx
// **بازطراحی حرفه‌ای (درخواست صریح کارفرما: «الان خیلی ساده هستن... باید از همه نظر به یک
// اپلیکیشن درجه‌یک بخورن»).** نسخه‌ی قبلی یک مستطیلِ تختِ دو‌ستونه بود با گرادیانِ خیلی کم‌رنگ و
// یک عکس چسبیده به لبه. تغییرات این نسخه:
//
//   ۱) **عمق و جنس:** به‌جای یک گرادیانِ صاف، سه لایه روی هم — گرادیانِ پایه‌ی رنگیِ دسته، یک
//      هاله‌ی نوریِ محو (blur) پشت عکس، و یک لایه‌ی روشناییِ ملایم که فقط هنگام هاور ظاهر می‌شود.
//   ۲) **آیکونِ نشان‌دار:** یک نشانِ (badge) کوچکِ رنگی با آیکون همان دسته بالای عنوان — دقیقاً
//      همان زبانِ بصریِ کارت‌های «دسترسی» و بنر VIP، تا کل صفحه‌ی اصلی یکدست حس شود.
//   ۳) **دعوت‌به‌اقدام (CTA):** یک ردیفِ «مشاهده ←» با فلشی که هنگام هاور جلو می‌رود. پیش از این
//      هیچ نشانه‌ی بصری‌ای وجود نداشت که کارت اصلاً قابل کلیک است.
//   ۴) **تایپوگرافی:** عنوان درشت‌تر و متن با کنتراست بهتر (`slate-600` به‌جای `slate-500`).
//   ۵) **حرکت:** کارت هنگام هاور کمی بالا می‌آید و عکس نرم زوم می‌شود (به‌جای چرخشِ قبلی که روی
//      عکس‌های واقعی کج به‌نظر می‌رسید).
//
// تمام برچسب‌ها همچنان از دیکشنری می‌آیند — هیچ متنی اینجا هاردکد نشده است.
import Link from "next/link";
import { CategoryBannerImage } from "./CategoryBannerImage";
import { Icons } from "@/components/ui/Icons";

export type CategoryBannerVariant = "listings" | "transport" | "services" | "realEstate";

const VARIANT_STYLES: Record<
  CategoryBannerVariant,
  {
    gradient: string;
    textColor: string;
    border: string;
    badge: string;
    glow: string;
    ctaColor: string;
    fallbackIconName: keyof typeof Icons;
    fallbackBg: string;
  }
> = {
  listings: {
    gradient: "from-blue-50 via-blue-50/50 to-white",
    textColor: "text-blue-700",
    border: "border-blue-100",
    badge: "bg-blue-500/10 text-blue-600",
    glow: "bg-blue-400/20",
    ctaColor: "text-blue-600",
    fallbackIconName: "Box",
    fallbackBg: "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500",
  },
  transport: {
    gradient: "from-orange-50 via-orange-50/50 to-white",
    textColor: "text-orange-700",
    border: "border-orange-100",
    badge: "bg-orange-500/10 text-orange-600",
    glow: "bg-orange-400/20",
    ctaColor: "text-orange-600",
    fallbackIconName: "Truck",
    fallbackBg: "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-500",
  },
  services: {
    gradient: "from-emerald-50 via-emerald-50/50 to-white",
    textColor: "text-emerald-700",
    border: "border-emerald-100",
    badge: "bg-emerald-500/10 text-emerald-600",
    glow: "bg-emerald-400/20",
    ctaColor: "text-emerald-600",
    fallbackIconName: "Wrench",
    fallbackBg: "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500",
  },
  realEstate: {
    gradient: "from-purple-50 via-purple-50/50 to-white",
    textColor: "text-purple-700",
    border: "border-purple-100",
    badge: "bg-purple-500/10 text-purple-600",
    glow: "bg-purple-400/20",
    ctaColor: "text-purple-600",
    fallbackIconName: "Home",
    fallbackBg: "bg-gradient-to-br from-purple-100 to-purple-50 text-purple-500",
  },
};

export function CategoryBanner({
  variant,
  href,
  title,
  description,
  imageSrc,
  ctaLabel,
}: {
  variant: CategoryBannerVariant;
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  // برچسب «مشاهده» — از دیکشنری می‌آید. اختیاری است تا اگر جایی هنوز پاس داده نشده، بنر
  // به‌جای نمایش یک رشته‌ی خالی، ردیف CTA را کاملاً حذف کند (بدون خطا و بدون متن هاردکد).
  ctaLabel?: string;
}) {
  const style = VARIANT_STYLES[variant];
  const BadgeIcon = Icons[style.fallbackIconName];

  return (
    <Link href={href} className="block group outline-none">
      <div
        className={`relative isolate flex items-stretch overflow-hidden rounded-[26px] border ${style.border} bg-gradient-to-l ${style.gradient} shadow-[0_2px_14px_rgba(0,0,0,0.04)] md:group-hover:shadow-[0_16px_38px_rgba(0,0,0,0.09)] md:group-hover:-translate-y-1 active:scale-[0.985] transition-all duration-300 ease-out min-h-[136px] md:min-h-[164px]`}
      >
        {/* هاله‌ی نوریِ محو پشت عکس — عمقِ سه‌بعدی می‌دهد بدون شلوغی */}
        <div
          className={`absolute -bottom-10 left-0 w-[190px] h-[190px] rounded-full blur-3xl ${style.glow} opacity-70 md:group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0`}
        />
        {/* لایه‌ی روشناییِ ملایمِ هاور */}
        <div className="absolute inset-0 bg-white/25 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />

        {/* متن */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 px-5 py-5 md:px-8 relative z-10">
          {/* نشانِ آیکونیِ دسته — عمداً بدون متن، چون عنوان بلافاصله زیرش می‌آید و تکرارِ متن
              کارت را شلوغ می‌کرد. */}
          <span
            className={`inline-flex items-center justify-center self-start rounded-2xl ${style.badge} w-9 h-9 md:w-11 md:h-11 md:group-hover:scale-110 transition-transform duration-300`}
            aria-hidden="true"
          >
            <BadgeIcon className="w-[18px] h-[18px] md:w-6 md:h-6 shrink-0" />
          </span>

          <h3 className={`font-black text-lg md:text-2xl ${style.textColor} leading-tight`}>
            {title}
          </h3>

          <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed line-clamp-2 md:line-clamp-none">
            {description}
          </p>

          {ctaLabel && (
            <span
              className={`inline-flex items-center gap-1 mt-1 text-xs md:text-sm font-extrabold ${style.ctaColor}`}
            >
              {ctaLabel}
              {/* هم‌رویه با بقیه‌ی اپ: آیکون ArrowRight با rotate-180 به یک فلشِ «جلو» در
                  چیدمان RTL تبدیل می‌شود؛ هنگام هاور کمی جلوتر می‌رود. */}
              <Icons.ArrowRight className="w-4 h-4 shrink-0 rotate-180 md:group-hover:-translate-x-1 transition-transform duration-300" />
            </span>
          )}
        </div>

        {/* عکس */}
        <div className="w-[118px] md:w-[210px] shrink-0 relative overflow-hidden flex items-center justify-center z-10">
          <div className="w-full h-full flex items-center justify-center md:group-hover:scale-[1.07] transition-transform duration-500 ease-out">
            <CategoryBannerImage
              src={imageSrc}
              fallbackIconName={style.fallbackIconName}
              fallbackWrapperClassName={style.fallbackBg}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}