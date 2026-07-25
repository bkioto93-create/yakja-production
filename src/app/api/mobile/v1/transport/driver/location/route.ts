// مسیر فایل (در ریپازیتوری وب): src/app/api/mobile/v1/transport/driver/location/route.ts
// فاز M03 موبایل، تسک ۵ — نسخه‌ی HTTP-محورِ همان ارسال دوره‌ای موقعیت مکانی که وب با
// updateDriverLocationAction (src/app/[lang]/transport/driver/actions.ts، از قبل موجود و برای
// فرم وب تست شده) از قبل دارد.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/transport/driver/active/route.ts (تسک ۴ همین فاز): صفر
// منطق تجاری تازه — فقط تابع موجود مستقیم صدا زده می‌شود. getCurrentUser() (داخل خودِ
// updateDriverLocationAction) هدر Authorization: Bearer <token> را می‌خواند (از فاز M01) — دقیقاً
// همان مکانیزمی که بقیه‌ی Route های موبایل هم استفاده می‌کنند؛ این فایل هیچ کد احراز هویت تازه‌ای
// ندارد.
//
// **چرا یک Route کاملاً مجزا از PATCH .../transport/driver/active (نه یک فیلد اضافه در همان
// بدنه):** این دو، رویدادهای کاربری کاملاً متفاوتی هستند — یکی «صرفاً یک کلیک روی سوییچ» (تسک ۴)
// و دیگری «ارسال خودکار مختصات هر ۳۰ تا ۶۰ ثانیه، بدون هیچ کنش صریح کاربر» (همین تسک)؛ نام Route
// (…/transport/driver/location) از همان ابتدا، در کامنت تسک ۴، پیش‌بینی و رزرو شده بود.
//
// PATCH — بدنه: { latitude: number, longitude: number }
//   خروجی موفق: { success: true }
//   خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی که
//   dict.transport.driverProfile.errors موبایل از قبل پوشش می‌دهد: unauthenticated،
//   profileNotFound (کاربر هنوز پروفایل راننده نساخته)، invalidLocation (مختصات خارج از بازه‌ی
//   مجاز یا غیرعددی)، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { updateDriverLocationAction } from "@/app/[lang]/transport/driver/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  profileNotFound: 400,
  invalidLocation: 400,
  dbError: 500,
};

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const latitude = typeof b.latitude === "number" ? b.latitude : NaN;
  const longitude = typeof b.longitude === "number" ? b.longitude : NaN;

  const result = await updateDriverLocationAction(latitude, longitude);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true });
}