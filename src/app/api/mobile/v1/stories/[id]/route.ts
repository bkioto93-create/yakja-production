// مسیر فایل: src/app/api/mobile/v1/stories/[id]/route.ts
// قابلیت استوری (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ همان «حذف زودهنگامِ استوریِ خودِ کاربر»
// که وب با deleteMyStoryAction (src/app/[lang]/profile/storyActions.ts) از قبل دارد.
//
// صفر منطق تجاری تازه — همان اکشنِ موجود عیناً فراخوانی می‌شود. بررسیِ احراز هویت و مالکیت
// («آیا این استوری واقعاً مالِ همین کاربر است؟») از قبل *داخلِ* deleteMyStoryAction انجام
// می‌شود (getCurrentUser + مقایسه‌ی owner_id) — همان getCurrentUser که از فاز M01 هم کوکیِ
// مرورگر را می‌شناسد هم هدرِ Authorization: Bearer را (src/lib/auth/session.ts)، پس این Route
// نیازی به هیچ بررسیِ احراز هویتِ تکراری ندارد.
//
// خروجی موفق: { success: true }
// خروجی ناموفق: { success: false, error } — error یکی از: unauthenticated (بدون نشست معتبر)،
// notFound (استوری وجود ندارد)، unauthorized (استوریِ کاربر دیگری است)، dbError.
// کدهای وضعیت HTTP متناظر، دقیقاً هم‌الگو با بقیه‌ی Routeهای پل موبایل.
import "server-only";
import { NextResponse } from "next/server";
import { deleteMyStoryAction } from "@/app/[lang]/profile/storyActions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  notFound: 404,
  unauthorized: 403,
  dbError: 500,
};

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await deleteMyStoryAction(id);

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}