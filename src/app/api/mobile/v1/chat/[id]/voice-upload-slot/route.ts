// مسیر فایل: src/app/api/mobile/v1/chat/[id]/voice-upload-slot/route.ts
// قابلیت پیام صوتی (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ صدورِ آدرسِ آپلودِ امضاشده برای یک پیام
// صوتی. صفر منطق تجاری تازه — همان createVoiceUploadSlotAction موجود
// (src/app/[lang]/chat/actions.ts) صدا زده می‌شود.
//
// بدون گیتِ سهمیه‌ی روزانه (طبق کامنتِ خودِ اکشن: «ویس بخشی از قابلیتِ پایه‌ی چت است، نه امتیاز
// VIP») — فقط بررسیِ عضویت در همین گفتگو.
import "server-only";
import { NextResponse } from "next/server";
import { createVoiceUploadSlotAction } from "@/app/[lang]/chat/actions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  unauthorized: 403,
  uploadFailed: 500,
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await createVoiceUploadSlotAction(id);

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}