// مسیر فایل: src/app/api/mobile/v1/stories/upload-slots/route.ts
// قابلیت استوری (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ همان createSignedStoryUploadSlotAction
// موجود (src/app/[lang]/profile/storyActions.ts). دقیقاً هم‌الگو با
// src/app/api/mobile/v1/transport/driver/upload-slots/route.ts (فاز M03 موبایل): صفر منطق
// تجاری تازه — همان اکشنِ موجود عیناً فراخوانی می‌شود.
//
// بدنه‌ی درخواست: { mediaType: "image" | "video", mimeType: string }
// خروجی موفق: { success: true, slot: { path, token } }
// خروجی ناموفق: { success: false, error } — error یکی از: unauthenticated، invalidMediaType،
// dailyLimitReached، uploadFailed.
import "server-only";
import { NextResponse } from "next/server";
import { createSignedStoryUploadSlotAction } from "@/app/[lang]/profile/storyActions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  invalidMediaType: 400,
  dailyLimitReached: 429,
  uploadFailed: 500,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.mediaType !== "string" || typeof body.mimeType !== "string") {
    return NextResponse.json({ success: false, error: "invalidMediaType" }, { status: 400 });
  }

  const result = await createSignedStoryUploadSlotAction({
    mediaType: body.mediaType,
    mimeType: body.mimeType,
  });

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}