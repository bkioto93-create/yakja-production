// مسیر فایل (در ریپازیتوری وب): src/app/api/mobile/v1/transport/driver/route.ts
// فاز M03 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان فرم ثبت/ویرایش پروفایل راننده که وب با
// saveDriverProfileAction (src/app/[lang]/transport/driver/actions.ts، تسک ۴ فاز ۰۳) و
// getMyDriverProfile (src/lib/transport/driverQueries.ts، همان تسک) از قبل دارد و تست شده.
//
// ⚠️ اصلاحیه: این فایل قبلاً یک فیلد imagePaths: string[] به saveDriverProfileAction می‌فرستاد.
// طبق بازطراحی «دو عکس اختصاصی» (خودِ راننده + وسیله‌ی نقلیه)، ستون عمومی images با دو ستون
// معنادار جایگزین شد و saveDriverProfileAction دیگر imagePaths را قبول نمی‌کند — به‌جایش
// personalPhotoPath (الزامی) و vehiclePhotoPath (اختیاری) می‌خواهد، دقیقاً هم‌الگو با
// DriverProfileClient.tsx (فرم وب). این Route هم برای هم‌راستایی با actions.ts به‌روزرسانی شد.
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
// POST / PATCH — بدنه:
//   { vehicleType, province, vehicleDetails, contactPhone,
//     personalPhotoPath: string, vehiclePhotoPath?: string | null, videoPath?: string | null }
//   personalPhotoPath و vehiclePhotoPath دقیقاً همان مسیرهای خامِ Storage (خروجی POST
//   .../transport/driver/upload-slots با photoType متناظر) هستند، نه URL کامل.
//   personalPhotoPath الزامی است (خود اکشن هم دوباره همین را چک می‌کند)؛ vehiclePhotoPath و
//   videoPath اختیاری‌اند و در نبودشان باید null فرستاده شوند (نه رشته‌ی خالی).
//
//   خروجی موفق: { success: true }
//   خروجی ناموفق: { success: false, error } — کدهای ممکن: unauthenticated، invalidVehicleType،
//   invalidProvince، invalidPhone، personalPhotoRequired، invalidImageData، notVip،
//   invalidVideoData، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyDriverProfile } from "@/lib/transport/driverQueries";
import { saveDriverProfileAction } from "@/app/[lang]/transport/driver/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidVehicleType: 400,
  invalidProvince: 400,
  invalidPhone: 400,
  personalPhotoRequired: 400,
  invalidImageData: 400,
  notVip: 403,
  invalidVideoData: 400,
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
    province: typeof b.province === "string" ? b.province : "",
    vehicleDetails: typeof b.vehicleDetails === "string" ? b.vehicleDetails : "",
    contactPhone: typeof b.contactPhone === "string" ? b.contactPhone : "",
    personalPhotoPath: typeof b.personalPhotoPath === "string" ? b.personalPhotoPath : "",
    vehiclePhotoPath: typeof b.vehiclePhotoPath === "string" ? b.vehiclePhotoPath : null,
    videoPath: typeof b.videoPath === "string" ? b.videoPath : null,
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