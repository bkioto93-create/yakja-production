// مسیر فایل: src/app/api/mobile/v1/stories/route.ts
// قابلیت استوری (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ همان createStoryAction موجود
// (src/app/[lang]/profile/storyActions.ts). صفر منطق تجاری تازه — همان اکشنِ موجود عیناً
// فراخوانی می‌شود؛ بررسیِ نهاییِ سهمیه‌ی روزانه و مدت‌زمانِ ویدئو (و پاک‌سازیِ خودکارِ فایلِ
// یتیم در صورت رد) از قبل *داخلِ* آن اکشن انجام می‌شود.
//
// بدنه‌ی درخواست: { mediaPath, mediaType, durationSeconds, width, height }
// خروجی موفق: { success: true }
// خروجی ناموفق: { success: false, error } — error یکی از: unauthenticated، invalidMediaType،
// invalidMediaData، invalidVideoDuration، dailyLimitReached، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { createStoryAction } from "@/app/[lang]/profile/storyActions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  invalidMediaType: 400,
  invalidMediaData: 400,
  invalidVideoDuration: 400,
  dailyLimitReached: 429,
  dbError: 500,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.mediaPath !== "string" || typeof body.mediaType !== "string") {
    return NextResponse.json({ success: false, error: "invalidMediaData" }, { status: 400 });
  }

  const result = await createStoryAction({
    mediaPath: body.mediaPath,
    mediaType: body.mediaType,
    durationSeconds:
      typeof body.durationSeconds === "number" ? body.durationSeconds : null,
    width: typeof body.width === "number" ? body.width : null,
    height: typeof body.height === "number" ? body.height : null,
  });

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}