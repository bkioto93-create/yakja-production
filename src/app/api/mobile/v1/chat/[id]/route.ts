// مسیر فایل: src/app/api/mobile/v1/chat/[id]/route.ts
// قابلیت چت (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ «باز کردن یک گفتگو»: هم‌زمان اطلاعاتِ خودِ
// گفتگو (getConversationForUser) و تاریخچه‌ی پیام‌ها (getConversationMessages) را با هم
// برمی‌گرداند — یک تماسِ شبکه به‌جای دو تا، طبق همان اولویتِ «کاهش درخواست‌ها برای اینترنت
// ضعیف» که در همه‌ی فازهای قبل رعایت شد.
//
// همان نشانگرِ خالی/marker برای برچسب‌های fallback — رجوع کنید به یادداشتِ کاملِ بالای
// src/app/api/mobile/v1/chat/route.ts.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationForUser, getConversationMessages } from "@/lib/chat/chatQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const conversation = await getConversationForUser(id, user.id, "", "", user.role === "admin");
  if (!conversation) {
    return NextResponse.json({ success: false, error: "notFound" }, { status: 404 });
  }

  const messages = await getConversationMessages(id);

  return NextResponse.json({ success: true, conversation, messages });
}