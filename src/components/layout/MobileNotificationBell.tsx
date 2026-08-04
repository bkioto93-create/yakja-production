// مسیر فایل: src/components/layout/MobileNotificationBell.tsx
// فاز ۱۴ — نگه‌دارِ موقعیت (Position Wrapper) زنگوله‌ی اعلان روی گوشی.
//
// دسکتاپ (md به‌بالا): زنگوله در DesktopHeader نمایش داده می‌شود (طبق فایل
// خودِ همان کامپوننت). موبایل: چون طراحی هر صفحه یک هدر بالای اختصاصی خودش
// دارد (مثلاً کاور برند در صفحه‌ی اصلی، هدر عنوان در صفحه‌ی تماس و ...)،
// اضافه‌کردن هدر مشترکی مثل دسکتاپ باعث تداخل با طراحی موجود می‌شد. راه‌حل:
// یک آیکون شناور کوچک در گوشه‌ی بالا-چپ همه‌ی صفحات (فقط زیر md دیده می‌شود)
// که رویِ محتوا شناور است، دقیقاً مثل آیکون DM در اینستاگرام یا زنگوله در
// اپ فیس‌بوک.
//
// موقعیت انتخابی: top-3 left-3 (چپ بالا) — عمداً نه راست. چون این پروژه RTL
// است، «چپ بالا» از دید کاربر همان «بالای دورترین گوشه از جهت متن» است، که
// معمولاً برای آیکون‌های ناوبری/اعلان به‌کار می‌رود بدون این‌که با متن یا
// دکمه‌های بازگشت (که معمولاً بالا-راست هستند) تداخل کند.
//
// نکته‌ی مهم: این کامپوننت فقط برای کاربر واردشده (nonAdmin || admin) رندر
// می‌شود. برای کاربر مهمان، پدرش (LangLayout) اصلاً آن را رندر نمی‌کند.
//
// **رفع باگ:** پروپ initialCount حذف شد — NotificationBell دیگر state محلی ندارد، عدد را از
// UnreadChatCountProvider می‌خواند (رجوع کنید به یادداشت آن فایل).
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
    <div className="md:hidden fixed top-3 left-3 z-40">
      <NotificationBell lang={lang} isAdmin={isAdmin} dict={dict} variant="floating" />
    </div>
  );
}