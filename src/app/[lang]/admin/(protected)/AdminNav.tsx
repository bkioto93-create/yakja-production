"use client";
// مسیر فایل: src/app/[lang]/admin/(protected)/AdminNav.tsx
// اصلاح UX موبایل پنل ادمین: نویگیشن قبلی یک ردیف افقیِ flex-wrap با ۷ لینک + دکمه‌ی خروج بود
// که روی صفحه‌ی گوشی به چند خط نامرتب می‌شکست، تشخیص صفحه‌ی فعال نداشت و لمس دقیق آیتم‌ها را
// سخت می‌کرد. این کامپوننت جایگزین همان بخش در layout.tsx شده و دو حالت دارد:
// - موبایل (زیر md): یک نوار فشرده با عنوان صفحه‌ی فعلی + دکمه‌ی همبرگری که یک منوی کشویی
//   عمودی با آیتم‌های تمام‌عرض (حداقل ۴۸ پیکسل ارتفاع، مناسب لمس با انگشت شست) باز می‌کند.
// - دسکتاپ (md به بالا): همان نوار افقی قبلی، بدون هیچ تغییر ظاهری، به‌علاوه‌ی هایلایت صفحه‌ی فعال.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** لینک ناوبری «اشتراک VIP» اضافه شد — عمداً در انتهای فهرست
// (بعد از «پیامک‌ها»)، دقیقاً هم‌رویه با «رانندگان و متخصصین»/«خدمات»/«گزارش‌ها»: چون همه‌ی
// امکانات پیش از آن از قبل در جایگاه مصوبِ خودشان قرار داشتند، این لینک تازه هم مثل بقیه‌ی لینک‌های
// تازه‌ی این پروژه در انتها اضافه شد. آیکون این لینک عمداً از @heroicons/react (CheckBadgeIcon)
// است، نه از Icons.tsx دستی‌ساز — دقیقاً همان تصمیم طراحی که برای VipBadge.tsx هم گرفته شد.
//
// **به‌روزرسانی فاز ۱۳ (چت با مدیر/پشتیبانی):** لینک ناوبری «چت‌ها» اضافه شد — بعد از «اشتراک
// VIP» (یعنی در انتهای فهرست، دقیقاً هم‌رویه با روند افزودن لینک‌های تازه‌ی این پروژه). چون آیکون
// Icons.MessageSquare از قبل برای لینک «پیامک‌ها» استفاده شده، برای جلوگیری از تکرار بصری، همان
// الگوی «اشتراک VIP» دنبال شد: یک آیکون مجزا از @heroicons/react (ChatBubbleLeftRightIcon).
import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { CheckBadgeIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { NotificationBell } from "@/components/chat/NotificationBell";
import type { Locale } from "@/lib/i18n/constants";

type NavDict = {
  dashboard: string;
  users: string;
  listings: string;
  sms: string;
  services: string;
  reports: string;
  providers: string;
  vip: string;
  chats: string;
  logout: string;
  menuLabel: string;
  notificationsAriaLabel: string;
};

// دکمه‌ی خروج، جدا از AdminNav، چون useFormStatus فقط داخل یک فرزندِ خودِ <form> کار می‌کند نه در
// همان کامپوننتی که <form> را رندر می‌کند. همین یک کامپوننت هم برای نسخه‌ی موبایل هم دسکتاپ
// استفاده می‌شود (فقط className فرق دارد)، تا در حین خروج (کمی طول می‌کشد چون کوکی سشن پاک
// می‌شود) کاربر هم یک اسپینر ببیند هم نتواند با زدن چندباره‌ی دکمه، درخواست را تکرار کند.
function LogoutButton({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} ${pending ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {pending ? (
        <Spinner className="w-5 h-5 shrink-0" label={label} />
      ) : (
        <Icons.LogOut className="w-5 h-5 shrink-0" />
      )}
      {!pending && label}
    </button>
  );
}

export function AdminNav({
  lang,
  dict,
  logoutAction,
  initialUnreadCount,
}: {
  lang: string;
  dict: NavDict;
  logoutAction: () => void | Promise<void>;
  // فاز ۱۴ — تعداد گفتگوهای خوانده‌نشده در لحظه‌ی رندر سرور. NotificationBell خودش
  // بعد از mount این عدد را با Realtime زنده به‌روز نگه می‌دارد.
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { href: `/${lang}/admin`, label: dict.dashboard, icon: Icons.LayoutDashboard, exact: true },
    { href: `/${lang}/admin/users`, label: dict.users, icon: Icons.User },
    { href: `/${lang}/admin/listings`, label: dict.listings, icon: Icons.CheckCircle },
    { href: `/${lang}/admin/providers`, label: dict.providers, icon: Icons.Users },
    { href: `/${lang}/admin/reports`, label: dict.reports, icon: Icons.Flag },
    { href: `/${lang}/admin/services`, label: dict.services, icon: Icons.Wrench },
    { href: `/${lang}/admin/sms`, label: dict.sms, icon: Icons.MessageSquare },
    { href: `/${lang}/admin/vip`, label: dict.vip, icon: CheckBadgeIcon },
    { href: `/${lang}/admin/chats`, label: dict.chats, icon: ChatBubbleLeftRightIcon },
  ];

  function isActive(href: string, exact?: boolean) {
    if (!pathname) return false;
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  const current = items.find((item) => isActive(item.href, item.exact)) ?? items[0];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl mb-6 shadow-sm">
      {/* نوار فشرده‌ی موبایل: فقط زیر md دیده می‌شود */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-2 font-extrabold text-text-main min-w-0">
          <current.icon className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">{current.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* فاز ۱۴ — زنگوله در نوار فشرده‌ی موبایل. برای پنل ادمین ما نمی‌خواهیم آیکون شناور
              MobileNotificationBell (که در layout عمومی [lang]/layout.tsx رندر می‌شود) هم روی
              پنل ادمین دیده شود، چون پنل ادمین محیط جداگانه‌ای است — به همین دلیل زنگوله را
              مستقیم داخل خودِ AdminNav می‌گذاریم. */}
          <NotificationBell
            lang={lang as Locale}
            isAdmin={true}
            initialCount={initialUnreadCount}
            dict={{ ariaLabel: dict.notificationsAriaLabel }}
            variant="header"
          />
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={dict.menuLabel}
            aria-expanded={isOpen}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-text-main active:bg-bg-base"
          >
            {isOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* منوی کشویی موبایل: فقط وقتی باز است رندر می‌شود */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 p-2 flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 min-h-[48px] font-bold transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-text-muted active:bg-bg-base"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <form action={logoutAction}>
            <LogoutButton
              label={dict.logout}
              className="w-full flex items-center gap-3 rounded-xl px-3 min-h-[48px] font-bold text-red-500 active:bg-red-50"
            />
          </form>
        </div>
      )}

      {/* نوار افقی دسکتاپ: همان طراحی قبلی، فقط از md به بالا دیده می‌شود */}
      <div className="hidden md:flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-5 flex-wrap">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 font-bold transition-colors ${
                  active ? "text-primary" : "text-text-muted hover:text-primary"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* فاز ۱۴ — زنگوله در نوار افقی دسکتاپ پنل ادمین (کنار دکمه‌ی خروج) */}
          <NotificationBell
            lang={lang as Locale}
            isAdmin={true}
            initialCount={initialUnreadCount}
            dict={{ ariaLabel: dict.notificationsAriaLabel }}
            variant="header"
          />
          <form action={logoutAction}>
            <LogoutButton
              label={dict.logout}
              className="flex items-center gap-2 font-bold text-red-500 text-sm"
            />
          </form>
        </div>
      </div>
    </div>
  );
}