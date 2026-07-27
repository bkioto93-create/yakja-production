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
// **به‌روزرسانی رنگ‌آمیزی (بازخورد: «آیکون‌ها بی‌روح هستند»):** پیش از این همه‌ی ۵ آیکون از یک
// پالت یکنواخت استفاده می‌کردند (خاکستری در حالت غیرفعال، فقط primary در حالت فعال) — یعنی هیچ
// تفاوت بصری‌ای بین «کالا»، «حمل‌ونقل»، «خدمات» و «پروفایل» وجود نداشت. حالا هرکدام رنگ اختصاصی
// خودش را دارد (دقیقاً هم‌رنگ با کارت‌های همین ماژول‌ها در صفحه‌ی اصلی)، حتی در حالت غیرفعال با
// کدورت کم یک ردِ رنگی دارد؛ در حالت فعال کاملاً پررنگ می‌شود. هیچ مسیر یا منطق تشخیص فعال/غیرفعال
// تغییر نکرد.
//
// **رفع باگ (۲۰۲۶-۰۷-۲۷) — بازخورد: «آیکون‌های nav bar افتضاحن»:** اول امتحان شد فقط ست آیکون
// دست‌ساز قبلی با یک ست خط‌محور دیگه (lucide-react) عوض بشه — اما چون هر دو یک‌جور «خط‌محور
// یکنواخت» بودن، فرق چشمگیری حس نمی‌شد. این‌بار الگوی طراحی هم عوض شد، نه فقط خودِ آیکون‌ها:
// همون پترنی که توی اکثر اپ‌های حرفه‌ای (اینستاگرام، ایربی‌ان‌بی) می‌بینید — تب غیرفعال «توخالی/
// خط‌محور» و تب فعال «توپر/رنگی» است. این تضاد بصری، خودش باعث می‌شه نوار خیلی حرفه‌ای‌تر و
// زنده‌تر به‌نظر برسه، حتی با همون آیکون‌های ساده. برای این کار از @heroicons/react استفاده شد
// (از سازندگان خودِ Tailwind CSS؛ همون کتابخونه‌ای که این پروژه از قبل باهاش می‌سازه) — چون هر
// آیکون هم نسخه‌ی outline و هم نسخه‌ی solid داره، دقیقاً مناسب همین الگو.
// نیاز به نصب: `npm install @heroicons/react` (به package.json هم اضافه شد).
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon as HomeOutline,
  ArchiveBoxIcon as ArchiveBoxOutline,
  TruckIcon as TruckOutline,
  WrenchScrewdriverIcon as WrenchOutline,
  UserIcon as UserOutline,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  ArchiveBoxIcon as ArchiveBoxSolid,
  TruckIcon as TruckSolid,
  WrenchScrewdriverIcon as WrenchSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";

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
    { id: "home", href: `/${currentLang}`, IconOutline: HomeOutline, IconSolid: HomeSolid, label: labels.home, pattern: "", activeText: "text-primary", activeBg: "bg-primary/10", inactiveText: "text-primary/40" },
    { id: "listings", href: `/${currentLang}/listings`, IconOutline: ArchiveBoxOutline, IconSolid: ArchiveBoxSolid, label: labels.listings, pattern: "listings", activeText: "text-blue-500", activeBg: "bg-blue-500/10", inactiveText: "text-blue-400/50" },
    { id: "transport", href: `/${currentLang}/transport`, IconOutline: TruckOutline, IconSolid: TruckSolid, label: labels.transport, pattern: "transport", activeText: "text-accent", activeBg: "bg-accent/10", inactiveText: "text-accent/40" },
    { id: "services", href: `/${currentLang}/services`, IconOutline: WrenchOutline, IconSolid: WrenchSolid, label: labels.services, pattern: "services", activeText: "text-emerald-500", activeBg: "bg-emerald-500/10", inactiveText: "text-emerald-400/50" },
    { id: "profile", href: `/${currentLang}/profile`, IconOutline: UserOutline, IconSolid: UserSolid, label: labels.profile, pattern: "profile", activeText: "text-purple-500", activeBg: "bg-purple-500/10", inactiveText: "text-purple-400/50" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 pb-safe md:hidden block shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between h-[65px] px-2 w-full">
        {navItems.map((item) => {
          const isActive = pureModuleRoot === item.pattern;
          // تب غیرفعال: نسخه‌ی خط‌محور (Outline) — تب فعال: نسخه‌ی توپر (Solid)
          const Icon = isActive ? item.IconSolid : item.IconOutline;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full p-2 space-y-1.5 rounded-[20px] active:scale-95 transition-all ${
                isActive ? `${item.activeText} ${item.activeBg}` : `${item.inactiveText} hover:opacity-80`
              }`}
            >
              {isActive && (
                <span className={`absolute top-0 h-[3px] w-7 rounded-full ${item.activeBg.replace("/10", "")}`} />
              )}
              <Icon className="w-[26px] h-[26px] transition-all" />
              <span
                className={`text-[10px] sm:text-xs leading-none transition-all ${
                  isActive ? "font-extrabold" : "font-semibold"
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