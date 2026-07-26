// مسیر فایل: src/app/api/mobile/v1/real-estate/upload-slots/route.ts
// فاز M05 موبایل، تسک ۴ — نسخه‌ی HTTP-محورِ همان مکانیزم Signed Upload URL که وب با
// createSignedUploadSlotsAction (src/app/[lang]/real-estate/new/actions.ts، تسک ۴/۵ فاز ۰۵)
// از قبل دارد و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/marketplace/upload-slots/route.ts (فاز M02 موبایل،
// تسک ۵): صفر منطق تجاری تازه — فقط createSignedUploadSlotsAction موجود عیناً صدا زده می‌شود.
// getCurrentUser() داخل خودِ آن اکشن هدر Authorization: Bearer <token> می‌خواند (فاز M01)، پس
// این Route هیچ نیازی به خواندن دستیِ کاربر ندارد.
//
// بدنه‌ی درخواست: { "count": number }  (بین ۱ تا ۵ — برخلاف گالری اختیاری متخصص در فاز M04،
// آگهی ملک حداقل ۱ عکس الزامی دارد: real_estate.images با CHECK cardinality(images) between 1 and 5).
// خروجی موفق: { success: true, slots: [{ path, token }, ...] }
// خروجی ناموفق: { success: false, error }  — کدهای ممکن: unauthenticated (۴۰۱)،
//   invalidImageCount (۴۰۰)، uploadFailed (۵۰۰).
import "server-only";
import { NextResponse } from "next/server";
import { createSignedUploadSlotsAction } from "@/app/[lang]/real-estate/new/actions";

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

  const result = await createSignedUploadSlotsAction(count);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true, slots: result.slots });
}