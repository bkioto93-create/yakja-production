// مسیر فایل: src/components/home/CategoryBanner.tsx
// بنر اسپلیت بالای هر بخش دسته‌بندی در صفحه‌ی اصلی — طبق درخواست صریح کارفرما: «متن سمت راست،
// عکس سمت چپ، پس‌زمینه‌ی خوشگل». چون کل اپ dir="rtl" است (رجوع کنید به LangHtmlSync)، همین که
// در JSX متن را قبل از عکس بگذاریم (ترتیب طبیعی DOM)، در یک flex-row معمولی خودکار متن سمت
// راست و عکس سمت چپ می‌نشیند — بدون نیاز به هیچ کلاس دستکاری جهتِ اضافه.
//
// این کامپوننت خودش Server Component است (نیازی به state ندارد)؛ فقط زیرمجموعه‌ی تصویر
// (CategoryBannerImage) که باید fallback را با state مدیریت کند، سمت کلاینت است — دقیقاً همان
// الگوی رایج این پروژه (صفحه‌ی سرور + یک زیرکامپوننت کلاینتِ کوچک).
import Link from "next/link";
import { CategoryBannerImage } from "./CategoryBannerImage";
import { Icons } from "@/components/ui/Icons";

export type CategoryBannerVariant = "listings" | "transport" | "services" | "realEstate";

// پس‌زمینه‌ی گرادیانی + رنگ متن هر دسته — دقیقاً همان چهار رنگی که کارت‌های «دسترسی سریع» در
// همین صفحه از قبل استفاده می‌کنند (آبی/نارنجی-accent/سبز/بنفش)، تا حس بصری یکدست بماند.
// bg-gradient-to-l یعنی رنگ از سمت راست (جایی که متن است) شروع و به‌سمت چپ (جایی که عکس است)
// محو می‌شود — پشت متن رنگی‌تر، پشت عکس خنثی‌تر، تا خودِ عکس بدون رقابت رنگی دیده شود.
const VARIANT_STYLES: Record<
  CategoryBannerVariant,
  { gradient: string; textColor: string; border: string; fallbackIconName: keyof typeof Icons; fallbackBg: string }
> = {
  listings: {
    gradient: "from-blue-50 via-blue-50/70 to-white",
    textColor: "text-blue-600",
    border: "border-blue-100",
    fallbackIconName: "Box",
    fallbackBg: "bg-blue-100/60 text-blue-500",
  },
  transport: {
    gradient: "from-accent/10 via-accent/5 to-white",
    textColor: "text-accent",
    border: "border-accent/20",
    fallbackIconName: "Truck",
    fallbackBg: "bg-accent/10 text-accent",
  },
  services: {
    gradient: "from-emerald-50 via-emerald-50/70 to-white",
    textColor: "text-emerald-600",
    border: "border-emerald-100",
    fallbackIconName: "Wrench",
    fallbackBg: "bg-emerald-100/60 text-emerald-500",
  },
  realEstate: {
    gradient: "from-purple-50 via-purple-50/70 to-white",
    textColor: "text-purple-600",
    border: "border-purple-100",
    fallbackIconName: "Home",
    fallbackBg: "bg-purple-100/60 text-purple-500",
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
    <Link href={href} className="block active:scale-[0.99] transition-transform">
      <div
        className={`flex items-stretch rounded-3xl overflow-hidden border ${style.border} bg-gradient-to-l ${style.gradient} shadow-[0_4px_20px_rgba(0,0,0,0.03)] min-h-[128px] md:min-h-[152px]`}
      >
        {/* متن — اول در DOM، پس در RTL خودکار سمت راست می‌نشیند */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 px-5 py-4 md:px-8">
          <h3 className={`font-extrabold text-base md:text-xl ${style.textColor}`}>{title}</h3>
          <p className="text-xs md:text-sm text-text-muted leading-relaxed line-clamp-2 md:line-clamp-none">
            {description}
          </p>
        </div>

        {/* عکس — دوم در DOM، پس در RTL خودکار سمت چپ می‌نشیند */}
        <div className="w-[112px] md:w-[190px] shrink-0 relative">
          <CategoryBannerImage
            src={imageSrc}
            fallbackIconName={style.fallbackIconName}
            fallbackWrapperClassName={style.fallbackBg}
          />
        </div>
      </div>
    </Link>
  );
}