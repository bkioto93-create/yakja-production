// مسیر فایل: src/components/layout/BottomNav.tsx
// کلاینت‌کامپوننتی فوق‌العاده حساس که هویت مسیریاب پنهان را روی تمام لایه‌ها برای کُلاینت‌های 2G تزریق می‌کند
// **تغییر یک‌خطی**: نقطه‌ی مخفی‌شدن از sm:hidden به md:hidden عوض شد تا دقیقاً هم‌زمان با
// نمایان‌شدن DesktopHeader (که hidden md:flex است) عمل کند و هیچ بازه‌ای (مثلاً تبلت ۶۴۰-۷۶۷px)
// بدون هیچ ناوبری‌ای نماند.
// **اصلاح ظاهری (۱۴۰۵/۰۴/۲۷ — بازخورد حین تست دستی)**: کنتراست بین تب فعال و غیرفعال افزایش
// یافت — تب فعال حالا پس‌زمینه‌ی پررنگ‌تر + یک خط نشانگر بالای آیکون دارد؛ تب‌های غیرفعال
// کم‌رنگ‌تر شدند (خاکستری روشن‌تر + کدورت کمتر روی آیکون) تا در نگاه اول مشخص باشد کاربر
// دقیقاً روی کدام تب است. هیچ مسیر یا منطقی تغییر نکرده، فقط استایل.
//
// **به‌روزرسانی تسک ۶ فاز ۰۸ («صیقل نهایی ظاهر اپ‌گونه»):**
// ۱) **رفع باگ Safe Area:** کلاس `pb-safe` از ابتدا اینجا استفاده می‌شد اما در globals.css هیچ‌جا
//    تعریف نشده بود (پس بدون هیچ اثری نادیده گرفته می‌شد). حالا که همان تسک این کلاس را با
//    `env(safe-area-inset-bottom)` تعریف کرده، این نوار روی گوشی‌های دارای نوار حرکتی سیستم‌عامل
//    (بیشتر آیفون‌های بدون دکمه‌ی Home) دیگر زیر آن نوار سیستمی قرار نمی‌گیرد.
// ۲) **لمس راحت‌تر:** فاصله‌ی داخلی هر آیتم از `p-1` به `p-2` افزایش یافت تا ناحیه‌ی قابل‌لمس هر تب
//    (نه فقط اندازه‌ی بصری آیکون) بزرگ‌تر و برای انگشت شست راحت‌تر باشد؛ فاصله‌ی بین آیکون و برچسب
//    هم کمی باز شد (`space-y-1` → `space-y-1.5`) تا شلوغ به‌نظر نرسد.
// ۳) **نشانگر فعال نرم‌تر:** خط نشانگر بالای تب فعال گردتر و کمی پهن‌تر شد؛ پس‌زمینه‌ی تب فعال هم
//    گردتری بیشتری گرفت (`rounded-2xl` → `rounded-[20px]`) تا با بقیه‌ی سطوح گرد اپ هم‌راستا باشد.
// هیچ مسیر، pattern یا منطق تشخیص تب فعال تغییر نکرد — فقط ظاهر و فاصله‌ها.
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";

export function BottomNav({
  labels,
}: {
  labels: { home: string; listings: string; transport: string; services: string; profile: string };
}) {
  const pathname = usePathname();
  // Extract correct Locale Context form pure current URIs matching rule: [ , 'ps'/'fa' , rootDir(null)?]
  const segments = pathname.split("/");
  const currentLang = segments[1] || "fa";
  const pureModuleRoot = segments[2] || "";

  const navItems = [
    { id: "home", href: `/${currentLang}`, icon: Icons.Home, label: labels.home, pattern: "" },
    { id: "listings", href: `/${currentLang}/listings`, icon: Icons.Box, label: labels.listings, pattern: "listings" },
    { id: "transport", href: `/${currentLang}/transport`, icon: Icons.Truck, label: labels.transport, pattern: "transport" },
    { id: "services", href: `/${currentLang}/services`, icon: Icons.Wrench, label: labels.services, pattern: "services" },
    { id: "profile", href: `/${currentLang}/profile`, icon: Icons.User, label: labels.profile, pattern: "profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 pb-safe md:hidden block shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between h-[65px] px-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pureModuleRoot === item.pattern;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full p-2 space-y-1.5 rounded-[20px] active:scale-95 transition-all ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-slate-300 hover:text-slate-400"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-[3px] w-7 rounded-full bg-primary" />
              )}
              <Icon
                className={`w-[26px] h-[26px] transition-all ${
                  isActive ? "stroke-[2.5px]" : "stroke-[1.75px] opacity-70"
                }`}
              />
              <span
                className={`text-[10px] sm:text-xs leading-none transition-all ${
                  isActive ? "text-primary font-extrabold" : "font-semibold opacity-70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}