// مسیر فایل: src/app/api/mobile/v1/transport/driver/upload-slots/route.ts
// فاز M03 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان مکانیزم Signed Upload URL که وب دارد.
//
// ⚠️ اصلاحیه: نسخه‌ی قبلی این فایل تابع «createDriverSignedUploadSlotsAction» را ایمپورت می‌کرد
// که یک آرایه از N اسلات یکسان صادر می‌کرد. آن تابع در actions.ts دیگر وجود ندارد — طبق
// بازطراحی «عکس‌ها» (درخواست صریح کارفرما)، به‌جای «حداکثر ۵ عکس در یک آرایه‌ی بی‌معنا»، حالا
// دقیقاً دو اسلات معنادار داریم: عکس خودِ راننده (personal) و عکس وسیله‌ی نقلیه (vehicle).
// تابع جایگزین «createDriverPhotoUploadSlotAction(photoType)» یک اسلاتِ تکی برمی‌گرداند، نه آرایه.
// این فایل هم برای هم‌راستا بودن با actions.ts و فرم وب (DriverProfileClient.tsx) به همین الگو
// به‌روزرسانی شد.
//
// بدنه‌ی درخواست:  { "photoType": "personal" | "vehicle" }
// خروجی موفق:      { success: true, slot: { path, token } }
// خروجی ناموفق:    { success: false, error }  — کدهای ممکن: unauthenticated (401)،
//   invalidPhotoType (400)، uploadFailed (500).
import "server-only";
import { NextResponse } from "next/server";
import { createDriverPhotoUploadSlotAction } from "@/app/[lang]/transport/driver/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidPhotoType: 400,
  uploadFailed: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalidPhotoType" }, { status: 400 });
  }

  const photoType =
    typeof body === "object" && body !== null && typeof (body as { photoType?: unknown }).photoType === "string"
      ? (body as { photoType: string }).photoType
      : "";

  if (photoType !== "personal" && photoType !== "vehicle") {
    return NextResponse.json({ success: false, error: "invalidPhotoType" }, { status: 400 });
  }

  const result = await createDriverPhotoUploadSlotAction(photoType);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true, slot: result.slot });
}