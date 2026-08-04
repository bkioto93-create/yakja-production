// مسیر فایل: src/components/home/CategoryBanner.tsx
// ارتقای بصری: افزودن افکت‌های هاور گروهی (تصویر زوم‌شونده نامحسوس)، سایه‌های سه‌بعدی نرم،
// و گرادیان‌های غنی‌تر برای ایجاد عمق بصری بسیار بالا در رابط کاربری.
import Link from "next/link";
import { CategoryBannerImage } from "./CategoryBannerImage";
import { Icons } from "@/components/ui/Icons";

export type CategoryBannerVariant = "listings" | "transport" | "services" | "realEstate";

const VARIANT_STYLES: Record<
  CategoryBannerVariant,
  { gradient: string; textColor: string; border: string; fallbackIconName: keyof typeof Icons; fallbackBg: string }
> = {
  listings: {
    gradient: "from-blue-50/90 via-blue-50/40 to-white",
    textColor: "text-blue-700",
    border: "border-blue-100",
    fallbackIconName: "Box",
    fallbackBg: "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500",
  },
  transport: {
    gradient: "from-orange-50/90 via-orange-50/40 to-white",
    textColor: "text-orange-700",
    border: "border-orange-100",
    fallbackIconName: "Truck",
    fallbackBg: "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-500",
  },
  services: {
    gradient: "from-emerald-50/90 via-emerald-50/40 to-white",
    textColor: "text-emerald-700",
    border: "border-emerald-100",
    fallbackIconName: "Wrench",
    fallbackBg: "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500",
  },
  realEstate: {
    gradient: "from-purple-50/90 via-purple-50/40 to-white",
    textColor: "text-purple-700",
    border: "border-purple-100",
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
}: {
  variant: CategoryBannerVariant;
  href: string;
  title: string;
  description: string;
  imageSrc: string;
}) {
  const style = VARIANT_STYLES[variant];

  return (
    <Link href={href} className="block group outline-none">
      <div
        className={`flex items-stretch rounded-[24px] overflow-hidden border ${style.border} bg-gradient-to-l ${style.gradient} shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all duration-300 min-h-[128px] md:min-h-[152px] relative`}
      >
        {/* افکت نوری محو در پس‌زمینه کارت برای عمق بیشتر */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* متن */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 px-5 py-5 md:px-8 relative z-10">
          <h3 className={`font-black text-lg md:text-xl ${style.textColor} drop-shadow-sm`}>
            {title}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 md:line-clamp-none">
            {description}
          </p>
        </div>

        {/* عکس — استفاده از overflow-hidden برای افکت زوم عکس هنگام هاور کل کارت */}
        <div className="w-[112px] md:w-[190px] shrink-0 relative overflow-hidden flex items-center justify-center">
          <div className="w-full h-full transform group-hover:scale-105 group-hover:-rotate-1 transition-transform duration-500 ease-out flex items-center justify-center">
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