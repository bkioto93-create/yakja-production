// مسیر فایل: src/components/layout/DesktopHeader.tsx
// **فایل جدید — اصلاح ظاهری طبق بند ۶.۱۵**: هیچ منطق یا مسیر جدیدی اضافه نشده، فقط یک
// نوار بالای صفحه که از md به‌بالا نمایش داده می‌شود (در موبایل کاملاً مخفی است؛ BottomNav
// دقیقاً همان‌جا (زیر md) جایگزینش می‌شود — نگاه کن به تغییر یک‌خطی در BottomNav.tsx).
// همه‌ی متون از دیکشنری موجود خوانده می‌شوند، هیچ متن هاردکد جدیدی اضافه نشده (الزام قطعی ۲).
// **اصلاح ظاهری (۱۴۰۵/۰۴/۲۷ — بازخورد حین تست دستی)**: تب فعال حالا پس‌زمینه‌ی پررنگ‌تر و یک
// خط زیرین (Underline) به رنگ primary دارد؛ تب‌های غیرفعال کم‌رنگ‌تر شدند (خاکستری روشن‌تر به‌جای
// text-muted) تا فاصله‌ی بصری بین تب فعال و بقیه در نگاه اول واضح باشد. هیچ مسیر یا منطقی تغییر نکرده.
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export function DesktopHeader({ lang, dict }: { lang: string; dict: Dictionary }) {
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
    <header className="hidden md:flex sticky top-0 z-40 w-full items-center justify-between gap-6 bg-white/90 backdrop-blur border-b border-slate-100 px-8 h-[72px] shadow-sm">
      <Link href={`/${lang}`} className="flex items-center gap-3 shrink-0">
        <Image
          src="/icons/yakja-icon-64.png"
          alt={dict.contact.brandVal}
          width={36}
          height={36}
          className="rounded-xl"
        />
        <span className="text-lg font-extrabold text-text-main whitespace-nowrap">
          {dict.contact.brandVal.split(" |")[0]}
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pureModuleRoot === item.pattern;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap border-b-2 ${
                isActive
                  ? "text-primary bg-primary/10 font-extrabold border-primary"
                  : "text-slate-400 font-semibold border-transparent hover:text-text-main hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/${lang}/profile`}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-text-main hover:bg-slate-50 transition-colors shrink-0 whitespace-nowrap"
      >
        <Icons.User className="w-4 h-4" />
        {dict.nav.profile}
      </Link>
    </header>
  );
}