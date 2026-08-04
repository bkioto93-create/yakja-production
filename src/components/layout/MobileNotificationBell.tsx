// مسیر فایل: src/components/layout/MobileNotificationBell.tsx
// ارتقای بصری: محصور کردن زنگوله در یک کپسول شیشه‌ای مات (Frosted Glass) با سایه نرم،
// تا هنگام اسکرول روی محتواهای متراکم، خوانایی و جذابیت بصری خود را حفظ کند.
"use client";

import { NotificationBell, type NotificationBellDict } from "@/components/chat/NotificationBell";
import type { Locale } from "@/lib/i18n/constants";

export function MobileNotificationBell({
  lang,
  isAdmin,
  dict,
}: {
  lang: Locale;
  isAdmin: boolean;
  dict: NotificationBellDict;
}) {
  return (
    <div className="md:hidden fixed top-4 left-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
      {/* 
        یک لایه شیشه‌ای ظریف پشت زنگوله که کمک می‌کند آیکون در هر پس‌زمینه‌ای واضح بماند 
        بدون اینکه فضای زیادی اشغال کند.
      */}
      <div className="bg-white/75 backdrop-blur-lg border border-slate-200/50 rounded-full p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <NotificationBell lang={lang} isAdmin={isAdmin} dict={dict} variant="floating" />
      </div>
    </div>
  );
}