// مسیر فایل: src/components/layout/DesktopHeader.tsx
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
    <header className="hidden md:flex sticky top-0 z-40 w-full items-center justify-between gap-6 bg-white/75 backdrop-blur-xl border-b border-slate-200/60 px-8 h-[76px] transition-all duration-300">
      
      {/* بخش لوگو و برند */}
      <Link 
        href={`/${lang}`} 
        className="flex items-center gap-3 shrink-0 group active:scale-95 transition-transform duration-200"
      >
        <div className="relative w-10 h-10 overflow-hidden rounded-[14px] shadow-sm shadow-primary/20 border border-slate-100 group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
          <Image
            src="/icons/yakja-icon-64.png"
            alt={dict.contact.brandVal}
            fill
            className="object-cover"
          />
        </div>
        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-l from-slate-900 to-slate-700 whitespace-nowrap tracking-tight">
          {dict.contact.brandVal.split(" |")[0]}
        </span>
      </Link>

      {/* ناوبری مرکزی (استایل Island/کپسولی) */}
      <nav className="flex items-center gap-1 p-1.5 bg-slate-100/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive = pureModuleRoot === item.pattern;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative px-5 py-2.5 rounded-[12px] text-sm whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "text-primary font-extrabold bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100/80"
                  : "text-slate-500 font-semibold border-transparent hover:text-slate-800 hover:bg-slate-200/40"
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
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-[14px] border border-slate-200 bg-white/50 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-primary hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 active:scale-95 whitespace-nowrap"
        >
          <Icons.User className="w-4.5 h-4.5" />
          {dict.nav.profile}
        </Link>
      </div>
    </header>
  );
}