// مسیر فایل: src/app/api/mobile/v1/chat/start/route.ts
// قابلیت چت (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ «شروع/ادامه‌ی گفتگو» با یک آگهی/پروفایل، برای
// ChatButton. صفر منطق تجاری تازه — همان startConversationAction موجود صدا زده می‌شود
// (idempotent؛ اگر گفتگو از قبل وجود داشت، همان شناسه برمی‌گردد، نه یک ردیفِ تکراری).
//
// بدنه‌ی درخواست: { contextType, contextId, ownerId }
// خروجی موفق: { success: true, conversationId }
// خروجی ناموفق: { success: false, error } — یکی از: unauthenticated، cannotChatWithSelf،
// dailyLimitReached، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { startConversationAction } from "@/app/[lang]/chat/actions";
import type { ChatContextType } from "@/lib/chat/chatQueries";

const VALID_CONTEXT_TYPES: ChatContextType[] = [
  "listing",
  "driver",
  "service_provider",
  "real_estate",
];

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  cannotChatWithSelf: 400,
  dailyLimitReached: 429,
  dbError: 500,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !VALID_CONTEXT_TYPES.includes(body.contextType) ||
    typeof body.contextId !== "string" ||
    typeof body.ownerId !== "string"
  ) {
    return NextResponse.json({ success: false, error: "dbError" }, { status: 400 });
  }

  const result = await startConversationAction(body.contextType, body.contextId, body.ownerId);

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}