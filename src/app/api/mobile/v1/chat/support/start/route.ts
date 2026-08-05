// مسیر فایل: src/app/api/mobile/v1/chat/support/start/route.ts
// قابلیت «چت با پشتیبانی» (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ همان
// startAdminSupportConversationAction موجود (src/app/[lang]/chat/actions.ts). Idempotent —
// اگر گفتگو از قبل وجود داشت (pending/active)، همان شناسه برمی‌گردد؛ اگر rejected بود، دوباره
// به pending برمی‌گردد.
//
// خروجی موفق: { success: true, conversationId }
// خروجی ناموفق: { success: false, error } — یکی از: unauthenticated، unavailable (هیچ حساب
// ادمینی پیکربندی نشده)، cannotChatWithSelf، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { startAdminSupportConversationAction } from "@/app/[lang]/chat/actions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  unavailable: 503,
  cannotChatWithSelf: 400,
  dbError: 500,
};

export async function POST() {
  const result = await startAdminSupportConversationAction();

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}