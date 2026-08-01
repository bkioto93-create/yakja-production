// مسیر فایل: src/components/vip/VipBadge.tsx
// فاز ۱۱ — کامپوننت مشترک «تیک VIP»، طبق بند ۵ پرامپت VIP. باید کنار نام/تماس فروشنده در همه‌ی
// این مکان‌ها ظاهر شود: پروفایل خود کاربر، کارت/جزئیات آگهی کالا، کارت راننده، کارت متخصص،
// کارت/جزئیات آگهی ملک (و در آینده، کنار نام کاربر در چت).
//
// طبق یادداشت طراحی صریح پرامپت: به‌جای Icons.tsx دستی‌ساز قدیمی، از کتابخانه‌ی حرفه‌ای
// @heroicons/react (که از قبل در پروژه نصب و در BottomNav.tsx استفاده شده) استفاده شد —
// CheckBadgeIcon نسخه‌ی solid، برای همان حس «تیک آبی رسمی» که پرامپت خواسته بود. رنگ آبی/طلایی
// با gradient سبک شد تا هم حس «رسمی و قابل‌اعتماد» (آبی) و هم حس «ویژه/پرمیوم» (طلایی) را با هم
// منتقل کند.
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

type VipBadgeSize = "sm" | "md";

export function VipBadge({
  label,
  size = "sm",
  className = "",
}: {
  label: string;
  size?: VipBadgeSize;
  className?: string;
}) {
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-extrabold shrink-0 ${
        isSmall ? "text-[11px] px-2 py-0.5 gap-0.5" : "text-xs px-2.5 py-1"
      } text-white bg-gradient-to-l from-amber-400 to-amber-500 ${className}`}
      title={label}
    >
      <CheckBadgeIcon className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {label}
    </span>
  );
}