// مسیر فایل (در ریپازیتوری وب): src/app/api/mobile/v1/transport/driver/route.ts
// فاز M03 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان فرم ثبت/ویرایش پروفایل راننده که وب با
// saveDriverProfileAction (src/app/[lang]/transport/driver/actions.ts، تسک ۴ فاز ۰۳) و
// getMyDriverProfile (src/lib/transport/driverQueries.ts، همان تسک) از قبل دارد و تست شده.
//
// دقیقاً هم‌الگو با سه Route فاز M02 (marketplace/listings، marketplace/my-listings،
// marketplace/upload-slots): صفر منطق تجاری تازه — فقط دو تابع موجود مستقیم صدا زده می‌شوند.
// getCurrentUser() (داخل هر دو تابع، و هم داخل خودِ این فایل برای GET) هدر
// Authorization: Bearer <token> را می‌خواند (از فاز M01) — دقیقاً همان مکانیزمی که چهار Route
// فاز M01 و سه Route فاز M02 هم استفاده می‌کنند؛ این فایل هیچ کد احراز هویت تازه‌ای ندارد.
//
// **چرا هم POST هم PATCH روی یک منطق:** برخلاف marketplace (ثبت آگهی، فقط create)،
// saveDriverProfileAction خودش از قبل یک upsert واحد است (اگر پروفایل راننده‌ی کاربر وجود داشته
// باشد به‌روزرسانی می‌شود، وگرنه ساخته می‌شود) — طبق نقشه‌راه («POST/PATCH یک Route»)، هر دو فعل
// HTTP به همین یک تابع نگاشت شدند؛ رفتار هر دو کاملاً یکسان است، صرفاً برای هم‌خوانی با قرارداد
// REST معمول (POST برای ثبت اول، PATCH برای ویرایش‌های بعدی) دو نام صادر شده‌اند، نه دو مسیر کد.
//
// GET — بدون بدنه‌ی ورودی. خروجی:
//   کاربر واردشده: { success: true, profile: MyDriverProfile | null }
//     (profile === null یعنی کاربر هنوز پروفایل راننده نساخته — فرم موبایل باید در «حالت ثبت» باز شود)
//   کاربر مهمان: { success: true, profile: null }  (در عمل موبایل این حالت را هرگز صدا نمی‌زند؛
//     خودش قبلش useAuth().user را چک می‌کند — دقیقاً هم‌رفتار با GET .../marketplace/my-listings)
//   «شماره تماس پیش‌فرض» عمداً در این پاسخ نیست: user.phoneNumber از قبل، از همان
//   GET /api/mobile/v1/profile (فاز M01)، سمت موبایل در دسترس است (useAuth().user.phoneNumber) —
//   نیازی به ارسال دوباره‌ی همان مقدار از این Route نبود.
//
// POST / PATCH — بدنه: { vehicleType, vehicleDetails, contactPhone, imagePaths: string[] }
//   imagePaths دقیقاً همان مسیرهای خامِ Storage (خروجی POST .../transport/driver/upload-slots)
//   است، نه URL کامل — عیناً همان قرارداد marketplace/listings (فاز M02).
//   خروجی موفق: { success: true }
//   خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی که
//   dict.transport.driverProfile.errors موبایل از قبل پوشش می‌دهد: unauthenticated،
//   invalidVehicleType، invalidPhone، invalidImageCount، invalidImageData، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyDriverProfile } from "@/lib/transport/driverQueries";
import { saveDriverProfileAction } from "@/app/[lang]/transport/driver/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidVehicleType: 400,
  invalidPhone: 400,
  invalidImageCount: 400,
  invalidImageData: 400,
  dbError: 500,
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: true, profile: null });
  }

  const profile = await getMyDriverProfile(user.id);
  return NextResponse.json({ success: true, profile });
}

async function handleSave(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const result = await saveDriverProfileAction({
    vehicleType: typeof b.vehicleType === "string" ? b.vehicleType : "",
    vehicleDetails: typeof b.vehicleDetails === "string" ? b.vehicleDetails : "",
    contactPhone: typeof b.contactPhone === "string" ? b.contactPhone : "",
    imagePaths: Array.isArray(b.imagePaths) ? (b.imagePaths as string[]) : [],
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  return handleSave(request);
}

export async function PATCH(request: Request) {
  return handleSave(request);
}