// مسیر فایل (در ریپازیتوری وب): src/app/api/mobile/v1/transport/driver/active/route.ts
// فاز M03 موبایل، تسک ۴ — نسخه‌ی HTTP-محورِ همان سوییچ فعال/غیرفعال که وب با
// setDriverActiveStatusAction (src/app/[lang]/transport/driver/actions.ts، تسک ۵ فاز ۰۳) از قبل
// دارد و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/transport/driver/route.ts (تسک ۲/۳ همین فاز): صفر منطق
// تجاری تازه — فقط تابع موجود مستقیم صدا زده می‌شود. getCurrentUser() (داخل خودِ
// setDriverActiveStatusAction) هدر Authorization: Bearer <token> را می‌خواند (از فاز M01) —
// دقیقاً همان مکانیزمی که بقیه‌ی Route های موبایل هم استفاده می‌کنند؛ این فایل هیچ کد احراز هویت
// تازه‌ای ندارد.
//
// **چرا یک Route کاملاً مجزا از POST/PATCH .../transport/driver (نه یک فیلد اضافه در همان بدنه):**
// دقیقاً همان دلیلی که خودِ setDriverActiveStatusAction را از saveDriverProfileAction جدا نگه
// داشته (کامنت بالای همان تابع در actions.ts) — «ذخیره‌ی کل فرم پروفایل» و «صرفاً یک کلیک روی
// سوییچ» دو رویداد کاربری متفاوتند؛ جدا نگه‌داشتن‌شان باعث می‌شود با هر بار زدن سوییچ، کل فرم
// (نوع وسیله/مشخصات/شماره تماس/عکس‌ها) دوباره به سرور ارسال نشود — مهم روی اینترنت ۲G/۳G ضعیف
// (بند ۵.۳ سند راهبردی). نام Route (…/transport/driver/active) هم‌الگو با Route آینده‌ی تسک ۵
// (…/transport/driver/location) انتخاب شده — هر دو زیرمسیر مجزا زیر همان منبع driver.
//
// PATCH — بدنه: { isActive: boolean }
//   خروجی موفق: { success: true }
//   خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی که
//   dict.transport.driverProfile.errors موبایل از قبل پوشش می‌دهد: unauthenticated،
//   profileNotFound (کاربر هنوز پروفایل راننده نساخته)، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { setDriverActiveStatusAction } from "@/app/[lang]/transport/driver/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  profileNotFound: 400,
  dbError: 500,
};

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const isActive =
    typeof body === "object" && body !== null && typeof (body as { isActive?: unknown }).isActive === "boolean"
      ? (body as { isActive: boolean }).isActive
      : null;

  if (isActive === null) {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const result = await setDriverActiveStatusAction(isActive);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true });
}