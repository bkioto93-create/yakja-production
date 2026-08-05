// مسیر فایل: src/app/api/mobile/v1/chat/[id]/voice/route.ts
// قابلیت پیام صوتی (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ ثبتِ نهاییِ پیامِ صوتی، بعد از آپلودِ
// موفق به Storage. صفر منطق تجاری تازه — همان sendVoiceMessageAction موجود صدا زده می‌شود.
// آرگومانِ اولِ آن اکشن (lang) فقط برای revalidatePath مسیرهای وب استفاده می‌شود — بی‌اثر برای
// موبایل.
//
// بدنه‌ی درخواست: { voicePath, durationSeconds }
import "server-only";
import { NextResponse } from "next/server";
import { sendVoiceMessageAction } from "@/app/[lang]/chat/actions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  unauthorized: 403,
  invalidVoiceData: 400,
  dbError: 500,
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.voicePath !== "string") {
    return NextResponse.json({ success: false, error: "invalidVoiceData" }, { status: 400 });
  }

  const durationSeconds = typeof body.durationSeconds === "number" ? body.durationSeconds : 0;
  const result = await sendVoiceMessageAction("fa", id, body.voicePath, durationSeconds);

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}