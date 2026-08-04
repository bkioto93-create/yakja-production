// مسیر فایل: src/components/chat/NotificationBell.tsx
// سیستم اعلان چت — آیکون زنگوله با نشان قرمز. سه جا استفاده می‌شود:
//   ۱) DesktopHeader (نوار بالای دسکتاپ) — قبل از دکمه‌ی پروفایل.
//   ۲) MobileNotificationBell (کامپوننت پوشش‌دهنده) — دکمه‌ی شناور بالا-چپ موبایل.
//   ۳) AdminNav (نوار ناوبری پنل مدیریت) — همراه با بقیه‌ی آیتم‌ها.
//
// **رفع باگ (کرش کامل صفحه):** این کامپوننت قبلاً خودش مستقل یک اشتراک Realtime می‌ساخت — چون
// چند نمونه از این کامپوننت هم‌زمان mount می‌شوند (فقط با CSS بین موبایل/دسکتاپ سوییچ می‌شوند،
// نه واقعاً mount/unmount)، این باعث تلاش برای ساخت دو کانال هم‌نام و کرش صفحه می‌شد. حالا این
// کامپوننت دیگر هیچ کانالی نمی‌سازد و هیچ state محلی‌ای ندارد — فقط عدد را از
// UnreadChatCountProvider (رجوع کنید به src/components/chat/UnreadChatCountProvider.tsx، که
// دقیقاً یک‌بار در src/app/[lang]/layout.tsx رندر می‌شود و تنها مالکِ اشتراک Realtime است)
// می‌خواند.
"use client";

import Link from "next/link";
import { BellIcon as BellOutline } from "@heroicons/react/24/outline";
import { BellIcon as BellSolid } from "@heroicons/react/24/solid";
import { useUnreadChatCount } from "@/components/chat/UnreadChatCountProvider";
import type { Locale } from "@/lib/i18n/constants";

export type NotificationBellDict = {
  ariaLabel: string;
};

export function NotificationBell({
  lang,
  isAdmin,
  dict,
  variant = "header",
  className = "",
}: {
  lang: Locale;
  isAdmin: boolean;
  dict: NotificationBellDict;
  // "header": آیکون بدون قاب برای داخل هدر/نوار ادمین.
  // "floating": دکمه‌ی شناور با پس‌زمینه‌ی سفید و سایه — مخصوص گوشه‌ی بالا-چپ موبایل.
  // "onDark": دکمه‌ی آیکونی مخصوص نوار بالای تیره‌ی موبایل (هم‌تم با بنر برند #0B1121).
  variant?: "header" | "floating" | "onDark";
  className?: string;
}) {
  const count = useUnreadChatCount();

  const href = isAdmin ? `/${lang}/admin/chats` : `/${lang}/chat`;
  const hasUnread = count > 0;
  // عدد بالاتر از ۹ به‌صورت «9+» نشان داده می‌شود — الگوی رایج تلگرام/جیمیل.
  const displayCount = count > 9 ? "9+" : String(count);

  const baseClasses =
    variant === "floating"
      ? "w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-text-main active:scale-95 transition-transform"
      : variant === "onDark"
        ? "w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center active:scale-95 transition-all"
        : "relative w-10 h-10 rounded-xl flex items-center justify-center text-text-main hover:bg-slate-50 active:scale-95 transition-transform";

  // رنگ آیکون: پیام خوانده‌نشده → فیروزه‌ای (روی هر پس‌زمینه‌ای خوب دیده می‌شود). بدون پیام:
  // روی نوار تیره سفیدِ کم‌رنگ، وگرنه خاکستریِ ملایم قبلی.
  const iconColor = hasUnread
    ? "text-primary"
    : variant === "onDark"
      ? "text-white/85"
      : "text-text-muted";

  const Icon = hasUnread ? BellSolid : BellOutline;

  return (
    <Link
      href={href}
      aria-label={dict.ariaLabel}
      className={`relative ${baseClasses} ${className}`}
    >
      <Icon className={`w-6 h-6 ${iconColor}`} />

      {hasUnread && (
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white leading-none"
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}