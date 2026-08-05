// مسیر فایل: src/app/api/mobile/v1/chat/[id]/messages/route.ts
// قابلیت چت (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ ارسالِ پیامِ متنی. صفر منطق تجاری تازه —
// همان sendTextMessageAction موجود صدا زده می‌شود. آرگومانِ اولِ آن اکشن (lang) فقط برای
// revalidatePath مسیرهای وب استفاده می‌شود — بی‌اثر برای موبایل، یک مقدارِ ثابت پاس داده شد.
//
// **محدوده‌ی این تحویل (فاز الف):** فقط پیامِ متنی. پیامِ صوتی (createVoiceUploadSlotAction/
// sendVoiceMessageAction) به فازِ ب موکول شد.
import "server-only";
import { NextResponse } from "next/server";
import { sendTextMessageAction } from "@/app/[lang]/chat/actions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  emptyMessage: 400,
  messageTooLong: 400,
  unauthorized: 403,
  dbError: 500,
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.content !== "string") {
    return NextResponse.json({ success: false, error: "emptyMessage" }, { status: 400 });
  }

  const result = await sendTextMessageAction("fa", id, body.content);

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}