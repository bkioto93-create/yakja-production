// مسیر فایل: src/app/api/mobile/v1/reports/route.ts
// فاز M06 موبایل، تسک ۲ — نسخه‌ی HTTP-محورِ همان ثبت گزارش تخلف که وب با createReportAction
// (src/app/[lang]/report/new/actions.ts، تسک ۴ فاز ۰۶) از قبل دارد و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/services/provider/route.ts (فاز M04 موبایل، تسک ۳):
// صفر منطق تجاری تازه — فقط createReportAction موجود صدا زده می‌شود؛ اعتبارسنجی نوع هدف/دلیل،
// بررسی واقعیِ وجود ردیف هدف، و رد گزارشِ خودِ فرد از خودش، همه از قبل داخل خودِ آن اکشن
// پیاده‌سازی و تست شده‌اند. getCurrentUser() داخل خودِ اکشن هدر Authorization: Bearer <token>
// می‌خواند (فاز M01)، پس این Route هیچ نیازی به خواندن دستیِ کاربر ندارد.
//
// بدنه‌ی درخواست: { targetType, targetId, reason, description? }
// خروجی موفق: { success: true }
// خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی که
//   dict.reports.newPage.errors موبایل از قبل پوشش می‌دهد: unauthenticated، invalidTarget،
//   invalidReason، targetNotFound، cannotReportSelf، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { createReportAction } from "@/app/[lang]/report/new/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidTarget: 400,
  invalidReason: 400,
  targetNotFound: 404,
  cannotReportSelf: 400,
  dbError: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const result = await createReportAction({
    targetType: typeof b.targetType === "string" ? b.targetType : "",
    targetId: typeof b.targetId === "string" ? b.targetId : "",
    reason: typeof b.reason === "string" ? b.reason : "",
    description: typeof b.description === "string" ? b.description : undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true });
}