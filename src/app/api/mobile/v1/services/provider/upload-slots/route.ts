// مسیر فایل: src/app/api/mobile/v1/services/provider/upload-slots/route.ts
// فاز M04 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان مکانیزم Signed Upload URL که وب با
// createServiceProviderSignedUploadSlotsAction (src/app/[lang]/services/provider/actions.ts،
// افزوده‌شده در به‌روزرسانی ۱۴۰۵/۰۴/۳۰) از قبل دارد و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/transport/driver/upload-slots/route.ts (فاز M03
// موبایل، تسک ۳): صفر منطق تجاری تازه — فقط createServiceProviderSignedUploadSlotsAction موجود
// عیناً صدا زده می‌شود. getCurrentUser() داخل خودِ آن اکشن هدر Authorization: Bearer <token>
// می‌خواند (فاز M01)، پس این Route هیچ نیازی به خواندن دستیِ کاربر ندارد.
//
// سقف تعداد بدون کف حداقلی است (۰ تا ۵) چون گالری نمونه‌کارِ متخصص کاملاً اختیاری است — دقیقاً
// همان رفتاری که خودِ createServiceProviderSignedUploadSlotsAction (باکت
// service-providers-images) از قبل پیاده کرده.
//
// بدنه‌ی درخواست: { "count": number }  (بین ۰ تا ۵)
// خروجی موفق: { success: true, slots: [{ path, token }, ...] }
// خروجی ناموفق: { success: false, error }  — کدهای ممکن: unauthenticated (۴۰۱)،
//   invalidImageCount (۴۰۰)، uploadFailed (۵۰۰).
import "server-only";
import { NextResponse } from "next/server";
import { createServiceProviderSignedUploadSlotsAction } from "@/app/[lang]/services/provider/actions";

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

  const result = await createServiceProviderSignedUploadSlotsAction(count);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true, slots: result.slots });
}
