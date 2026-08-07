// مسیر فایل: src/components/layout/DesktopHeader.tsx
//
// 🛠️ بازطراحیِ کامل (تعمیقِ رنگِ بنر در سراسر اپ — دستور صریحِ کارفرما): پس‌زمینه از سفیدِ
// نیمه‌شفاف به bg-hero-dark/90 تغییر کرد — همان #0B1121 بنرِ اصلی — تا هدرِ دسکتاپ هم بخشی از
// همان قابِ تیره‌ی برند باشد (معادلِ همین تغییر در BottomNav.tsx/app/(tabs)/_layout.tsx
// موبایل). هر عنصرِ داخلش که رنگِ متن/حاشیه‌اش برای زمینه‌ی روشن انتخاب شده بود (متنِ برند،
// کپسولِ ناوبری، دکمه‌ی پروفایل) به معادلِ on-dark خودش تغییر کرد — رجوع کنید به کامنتِ کنارِ
// هرکدام. کپسولِ تبِ فعال («جزیره‌ی سفید») عمداً دست‌نخورده ماند: پس‌زمینه‌ی سفیدش روی هدرِ تیره
// حتی برجسته‌تر و «اسپات‌لایت‌مانند» دیده می‌شود، نیازی به تغییر نداشت.
// **فایل جدید — ارتقای بصری حرفه‌ای**: طراحی مدرن مبتنی بر Island UI و Glassmorphism.
// اضافه شدن میکرو-اینترکشن‌ها، سایه‌های نرم، و ساختار کپسولی برای ناوبری که حس یک
// وب‌اپلیکیشن در سطح جهانی (مانند Vercel/Linear) را به کاربر القا می‌کند.
// هیچ متن هاردکدی اضافه نشده و منطق مسیریابی و زنگوله کاملاً دست‌نخورده باقی مانده است.
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { NotificationBell } from "@/components/chat/NotificationBell";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export function DesktopHeader({
  lang,
  dict,
  showNotifications,
  isAdmin,
}: {
  lang: string;
  dict: Dictionary;
  showNotifications: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const pureModuleRoot = segments[2] || "";

  const navItems = [
    { id: "home", href: `/${lang}`, label: dict.nav.home, pattern: "" },
    { id: "listings", href: `/${lang}/listings`, label: dict.nav.listings, pattern: "listings" },
    { id: "transport", href: `/${lang}/transport`, label: dict.nav.transport, pattern: "transport" },
    { id: "services", href: `/${lang}/services`, label: dict.nav.services, pattern: "services" },
  ];

  return (
    <header className="hidden md:flex sticky top-0 z-40 w-full items-center justify-between gap-6 bg-hero-dark/90 backdrop-blur-xl border-b border-on-dark-border px-8 h-[76px] transition-all duration-300">
      
      {/* بخش لوگو و برند */}
      <Link 
        href={`/${lang}`} 
        className="flex items-center gap-3 shrink-0 group active:scale-95 transition-transform duration-200"
      >
        <div className="relative w-10 h-10 overflow-hidden rounded-[14px] shadow-sm shadow-primary/20 border border-on-dark-border group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
          <Image
            src="/icons/yakja-icon-64.png"
            alt={dict.contact.brandVal}
            fill
            className="object-cover"
          />
        </div>
        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-l from-white to-white/70 whitespace-nowrap tracking-tight">
          {dict.contact.brandVal.split(" |")[0]}
        </span>
      </Link>

      {/* ناوبری مرکزی (استایل Island/کپسولی) */}
      <nav className="flex items-center gap-1 p-1.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-on-dark-border shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
        {navItems.map((item) => {
          const isActive = pureModuleRoot === item.pattern;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative px-5 py-2.5 rounded-[12px] text-sm whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "text-primary font-extrabold bg-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-slate-100/80"
                  : "text-on-dark-muted font-semibold border-transparent hover:text-on-dark hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* بخش ابزارها و پروفایل */}
      <div className="flex items-center gap-3 shrink-0">
        {showNotifications && (
          <NotificationBell
            lang={lang as Locale}
            isAdmin={isAdmin}
            dict={{ ariaLabel: dict.notifications.ariaLabel }}
            variant="header"
          />
        )}

        <Link
          href={`/${lang}/profile`}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-[14px] border border-on-dark-border bg-white/5 text-sm font-extrabold text-on-dark shadow-sm hover:bg-white/10 hover:text-primary hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-300 active:scale-95 whitespace-nowrap"
        >
          <Icons.User className="w-4.5 h-4.5" />
          {dict.nav.profile}
        </Link>
      </div>
    </header>
  );
}