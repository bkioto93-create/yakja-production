// مسیر فایل: src/components/layout/MobileNotificationBell.tsx
// **بازطراحی (Premium Enterprise / Dark Mode):** پیش از این، زنگوله یک دکمه‌ی «شناور» با
// موقعیت `fixed top-4 left-4` بود؛ یعنی هنگام اسکرول، ثابت می‌ماند و روی محتوای صفحه می‌افتاد و
// دست‌وپاگیر می‌شد. حالا این کامپوننت دیگر هیچ موقعیت شناوری ندارد — صرفاً خودِ آیکونِ زنگوله را
// با ظاهرِ مخصوصِ «نوار تیره» (variant="onDark") برمی‌گرداند و داخل «نوار بالای موبایل»
// (ProvinceBar، حالتِ موبایل) نشانده می‌شود. آن نوار `sticky` است (نه `fixed`)، پس فضای خودش را
// در چیدمان می‌گیرد و هرگز روی محتوا نمی‌افتد.
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
  return <NotificationBell lang={lang} isAdmin={isAdmin} dict={dict} variant="onDark" />;
}