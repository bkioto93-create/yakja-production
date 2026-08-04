// مسیر فایل: src/components/chat/NotificationBell.tsx
// فاز ۱۴ — سیستم اعلان چت (Chat Notifications).
//
// این کامپوننت یک آیکون زنگوله با نشان کوچک قرمزِ «تعداد گفتگوهای خوانده‌نشده»
// می‌سازد. سه جا استفاده می‌شود:
//   ۱) DesktopHeader (نوار بالای دسکتاپ) — قبل از دکمه‌ی پروفایل.
//   ۲) MobileNotificationBell (کامپوننت پوشش‌دهنده) — به‌عنوان دکمه‌ی شناور
//      بالا-راست موبایل.
//   ۳) AdminNav (نوار ناوبری پنل مدیریت) — همراه با بقیه‌ی آیتم‌ها.
//
// اصل طراحی:
//   * مقدار initialCount از سمت سرور می‌آید (تا نشان بلافاصله بدون چشمک‌زدن
//     نمایش داده شود).
//   * پس از رندر اولیه، یک اشتراک Supabase Realtime روی INSERT های جدول
//     chat_messages برقرار می‌شود؛ هر پیامی که در هر گفتگویی درج شود، این
//     کامپوننت شمارش را از سرور دوباره بازخوانی می‌کند. با این روش:
//       - نیازی به فیلتر پیچیده‌ی سمتِ کلاینت روی چه گفتگوهایی متعلق به من است
//         نیست — تصمیم درست‌بودن یا نبودن با getUnreadChatCount در سرور گرفته
//         می‌شود، که خودش از کوکی نشست کاربر جاری آگاه است.
//       - اگر خودم یک پیام بفرستم، بازخوانی مقدار درست را (احتمالاً بدون
//         تغییر عدد چون خودم فرستم=خودم خواندم) می‌گیرد — بی‌ضرر.
//   * برای گفتگوی‌های نوع admin_support، تغییرات ستون status جدول
//     conversations هم گوش داده می‌شود (رد/تایید یک درخواست پشتیبانی نیز
//     شمارش را عوض می‌کند).
//
// جهت لینک زنگوله بسته به نقش کاربر:
//   * ادمین → /admin/chats
//   * کاربر عادی/VIP → /chat
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon as BellOutline } from "@heroicons/react/24/outline";
import { BellIcon as BellSolid } from "@heroicons/react/24/solid";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { fetchUnreadChatCountAction } from "@/app/[lang]/chat/actions";
import type { Locale } from "@/lib/i18n/constants";

export type NotificationBellDict = {
  ariaLabel: string;
};

export function NotificationBell({
  lang,
  isAdmin,
  initialCount,
  dict,
  variant = "header",
  className = "",
}: {
  lang: Locale;
  isAdmin: boolean;
  initialCount: number;
  dict: NotificationBellDict;
  // "header": آیکون بدون قاب برای داخل هدر/نوار ادمین.
  // "floating": دکمه‌ی شناور با پس‌زمینه‌ی سفید و سایه — مخصوص گوشه‌ی بالا-راست موبایل.
  variant?: "header" | "floating";
  className?: string;
}) {
  const [count, setCount] = useState(initialCount);
  // به‌روزرسانی به‌محض تغییر initialCount (وقتی سرور دوباره صفحه را رندر می‌کند،
  // مثلاً بعد از یک navigation از یک صفحه‌ی چت به بقیه‌ی صفحات).
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // برای جلوگیری از اجرای هم‌زمان چندین بازخوانی وقتی چند رویداد Realtime پشت‌سرِ هم
  // می‌آیند (مثلاً چند پیام در چند گفتگو با فاصله‌ی چند صدم ثانیه)، از یک flag ساده
  // استفاده می‌کنیم — اگر یکی در جریان است، بازخوانی جدید فقط یک بار بعد از اتمامِ
  // قبلی اجرا می‌شود.
  const isRefetchingRef = useRef(false);
  const pendingRefetchRef = useRef(false);

  async function refetchCount() {
    if (isRefetchingRef.current) {
      pendingRefetchRef.current = true;
      return;
    }
    isRefetchingRef.current = true;
    try {
      const { count: nextCount } = await fetchUnreadChatCountAction();
      setCount(nextCount);
    } catch {
      // خطای شبکه بی‌سروصدا نادیده گرفته می‌شود — عدد فعلی همان می‌ماند و در
      // بازخوانی بعدی به‌روز خواهد شد. اعلانْ یک ویژگی راحتی است، نه بحرانی.
    } finally {
      isRefetchingRef.current = false;
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        // اجرای موخر — بدون await، تا chained refetch ها stack تولید نکنند.
        void refetchCount();
      }
    }
  }

  useEffect(() => {
    // اشتراک روی درجِ هر پیام تازه در هر گفتگویی. با یک کلید ثابت تا تنها یک
    // کانال روی مرورگر کاربر باز شود.
    const messagesChannel = supabaseBrowserClient
      .channel("chat-notifications-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          void refetchCount();
        }
      )
      .subscribe();

    // اشتراک روی به‌روزرسانی conversations — تا وقتی یک گفتگوی admin_support از
    // pending به active/rejected می‌رود (یا last_read_at طرف مقابل عوض می‌شود)،
    // نشان زنگوله هم به‌روز شود.
    const conversationsChannel = supabaseBrowserClient
      .channel("chat-notifications-conversations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          void refetchCount();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowserClient.removeChannel(messagesChannel);
      supabaseBrowserClient.removeChannel(conversationsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const href = isAdmin ? `/${lang}/admin/chats` : `/${lang}/chat`;
  const hasUnread = count > 0;
  // عدد بالاتر از ۹ به‌صورت «9+» نشان داده می‌شود — الگوی رایج تلگرام/جیمیل.
  const displayCount = count > 9 ? "9+" : String(count);

  const baseClasses =
    variant === "floating"
      ? "w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-text-main active:scale-95 transition-transform"
      : "relative w-10 h-10 rounded-xl flex items-center justify-center text-text-main hover:bg-slate-50 active:scale-95 transition-transform";

  const Icon = hasUnread ? BellSolid : BellOutline;

  return (
    <Link
      href={href}
      aria-label={dict.ariaLabel}
      className={`relative ${baseClasses} ${className}`}
    >
      <Icon className={`w-6 h-6 ${hasUnread ? "text-primary" : "text-text-muted"}`} />

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