// مسیر فایل: src/app/api/mobile/v1/transport/driver/upload-slots/route.ts
// فاز M03 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان مکانیزم Signed Upload URL که وب با
// createDriverSignedUploadSlotsAction (src/app/[lang]/transport/driver/actions.ts، افزوده‌شده در
// به‌روزرسانی ۱۴۰۵/۰۴/۳۰) از قبل دارد و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/marketplace/upload-slots/route.ts (فاز M02 موبایل):
// صفر منطق تجاری تازه — فقط createDriverSignedUploadSlotsAction موجود عیناً صدا زده می‌شود.
// getCurrentUser() داخل خودِ آن اکشن هدر Authorization: Bearer <token> را می‌خواند (فاز M01)،
// پس این Route هیچ نیازی به خواندن دستیِ کاربر ندارد.
//
// ⚠️ یافته‌ی ممیزی تسک ۳ فاز M03: کامنت بالای src/app/api/mobile/v1/transport/driver/route.ts
// (تسک ۲ فاز M03 موبایل) از قبل به همین مسیر («POST .../transport/driver/upload-slots») اشاره
// می‌کرد، انگار این Route از قبل ساخته شده — اما در عمل این فایل هرگز وجود نداشت (فقط اکشن سمت
// سرورش، createDriverSignedUploadSlotsAction، برای فرم وب از قبل نوشته شده بود). بدون این فایل،
// هیچ عکسی از اپ موبایل قابل‌آپلود نبود. همین تسک آن را می‌سازد.
//
// تنها تفاوت با نسخه‌ی marketplace: سقف تعداد اینجا بدون کف حداقلی است (۰ تا ۵) چون عکس پروفایل
// راننده کاملاً اختیاری است (برخلاف حداقل ۱ عکس اجباری آگهی کالا) — دقیقاً همان رفتاری که خودِ
// createDriverSignedUploadSlotsAction (باکت drivers-images) از قبل پیاده کرده.
//
// بدنه‌ی درخواست: { "count": number }  (بین ۰ تا ۵)
// خروجی موفق: { success: true, slots: [{ path, token }, ...] }
// خروجی ناموفق: { success: false, error }  — کدهای ممکن: unauthenticated (۴۰۱)،
//   invalidImageCount (۴۰۰)، uploadFailed (۵۰۰).
import "server-only";
import { NextResponse } from "next/server";
import { createDriverSignedUploadSlotsAction } from "@/app/[lang]/transport/driver/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidImageCount: 400,
  uploadFailed: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalidImageCount" }, { status: 400 });
  }

  const count =
    typeof body === "object" && body !== null && typeof (body as { count?: unknown }).count === "number"
      ? (body as { count: number }).count
      : NaN;

  const result = await createDriverSignedUploadSlotsAction(count);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true, slots: result.slots });
}