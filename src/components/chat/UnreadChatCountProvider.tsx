// مسیر فایل: src/components/chat/UnreadChatCountProvider.tsx
// سیستم اعلان چت — منبع واحد و مرکزیِ «تعداد گفتگوهای خوانده‌نشده» برای کل اپ.
//
// **رفع باگ (کرش کامل صفحه):** قبلاً هر نمونه‌ی NotificationBell خودش مستقل یک اشتراک
// Realtime با نام کانال ثابت می‌ساخت. چون چهار جای مختلف اپ (DesktopHeader، MobileNotification
// Bell، نوار موبایل/دسکتاپ AdminNav) هم‌زمان mount می‌شوند — فقط با کلاس‌های CSS مثل
// `hidden md:flex` بین آن‌ها سوییچ می‌شود، نه واقعاً mount/unmount — وقتی دو یا چند نمونه
// هم‌زمان تلاش می‌کردند روی یک کانالِ هم‌نام (که Supabase در همان کلاینت مرورگر دوباره استفاده
// می‌کند) `.on(...)` صدا بزنند، نمونه‌ی دوم به بعد با خطای:
//   «cannot add postgres_changes callbacks for realtime:chat-notifications-messages after
//   subscribe()»
// مواجه می‌شدند — که کل صفحه را کرش می‌کرد.
//
// راه‌حل: این Provider دقیقاً یک‌بار، در بالاترین نقطه‌ی ممکن (src/app/[lang]/layout.tsx، که
// همه‌ی صفحات از جمله پنل ادمین را هم در بر می‌گیرد)، رندر می‌شود و تنها مالکِ اشتراک Realtime
// است. NotificationBell دیگر هیچ کانالی نمی‌سازد — فقط عدد را از این Context می‌خواند
// (useUnreadChatCount). فایده‌ی جانبی: به‌جای تا ۴ اشتراک Realtime و تا ۴ فراخوانی سرور به‌ازای
// هر پیام تازه (قبل از این رفع باگ)، حالا دقیقاً یکی — سبک‌تر برای سرور و برای مرورگر کاربر.
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { fetchUnreadChatCountAction } from "@/app/[lang]/chat/actions";

const UnreadChatCountContext = createContext<number>(0);

export function useUnreadChatCount(): number {
  return useContext(UnreadChatCountContext);
}

export function UnreadChatCountProvider({
  initialCount,
  enabled,
  children,
}: {
  initialCount: number;
  // کاربر مهمان (بدون نشست) هیچ گفتگویی ندارد؛ enabled=false یعنی حتی یک اشتراک Realtime هم
  // برقرار نمی‌شود — یک اتصال WebSocket بی‌فایده برای هر بازدیدکننده‌ی مهمان باز نمی‌ماند.
  enabled: boolean;
  children: ReactNode;
}) {
  const [count, setCount] = useState(initialCount);

  // به‌روزرسانی به‌محض تغییر initialCount (مثلاً بعد از یک navigation که سرور دوباره رندر کرده).
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

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
      // خطای شبکه بی‌سروصدا نادیده گرفته می‌شود — عدد فعلی همان می‌ماند و در بازخوانی بعدی
      // به‌روز خواهد شد. اعلانْ یک ویژگی راحتی است، نه بحرانی.
    } finally {
      isRefetchingRef.current = false;
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        void refetchCount();
      }
    }
  }

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled]);

  return (
    <UnreadChatCountContext.Provider value={count}>{children}</UnreadChatCountContext.Provider>
  );
}