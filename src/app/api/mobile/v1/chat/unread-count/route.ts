// مسیر فایل: src/app/api/mobile/v1/chat/unread-count/route.ts
// قابلیت چت (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ شمارشِ «گفتگوهای خوانده‌نشده»، برای زنگوله‌ی
// اعلانِ موبایل. صفر منطق تجاری تازه — همان fetchUnreadChatCountAction موجود
// (src/app/[lang]/chat/actions.ts) صدا زده می‌شود، که خودش getUnreadChatCount
// (src/lib/chat/chatNotifications.ts) را با isAdmin درستِ کاربر صدا می‌زند.
//
// برای کاربر مهمان همیشه صفر برمی‌گردد (نه خطا) — دقیقاً هم‌رفتار با خودِ اکشن.
import "server-only";
import { NextResponse } from "next/server";
import { fetchUnreadChatCountAction } from "@/app/[lang]/chat/actions";

export async function GET() {
  const { count } = await fetchUnreadChatCountAction();
  return NextResponse.json({ count });
}