// مسیر فایل (در ریپازیتوری وب): src/app/api/mobile/v1/services/provider/route.ts
// فاز M04 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان فرم ثبت/ویرایش پروفایل متخصص که وب با
// saveServiceProviderProfileAction (src/app/[lang]/services/provider/actions.ts، تسک ۶ فاز ۰۴) و
// getMyServiceProviderProfile (src/lib/services/serviceProviderQueries.ts، همان تسک) از قبل دارد
// و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/transport/driver/route.ts (فاز M03 موبایل، تسک ۳):
// صفر منطق تجاری تازه — فقط دو تابع موجود مستقیم صدا زده می‌شوند. getCurrentUser() (داخل هر دو
// تابع، و هم داخل خودِ این فایل برای GET) هدر Authorization: Bearer <token> را می‌خواند (از فاز
// M01) — دقیقاً همان مکانیزمی که بقیه‌ی Route های موبایل هم استفاده می‌کنند؛ این فایل هیچ کد
// احراز هویت تازه‌ای ندارد.
//
// **چرا هم POST هم PATCH روی یک منطق:** دقیقاً همان دلیل transport/driver/route.ts —
// saveServiceProviderProfileAction خودش از قبل یک upsert واحد است (یکتایی هر کاربر=یک پروفایل
// متخصص با Unique Constraint روی service_providers.owner_id تضمین شده)؛ هر دو فعل HTTP به همین
// یک تابع نگاشت شدند، صرفاً برای هم‌خوانی با قرارداد REST معمول.
//
// GET — بدون بدنه‌ی ورودی. خروجی:
//   کاربر واردشده: { success: true, profile: MyServiceProviderProfile | null }
//     (profile === null یعنی کاربر هنوز پروفایل متخصص نساخته — فرم موبایل باید در «حالت ثبت» باز شود)
//   کاربر مهمان: { success: true, profile: null }  (در عمل موبایل این حالت را هرگز صدا نمی‌زند؛
//     خودش قبلش useAuth().user را چک می‌کند — دقیقاً هم‌رفتار با GET .../transport/driver)
//   isActive در پاسخ هست (تسک ۵ فاز M04، برای اعلان «پروفایل پنهان‌شده») — طبق همان ستون
//   service_providers.is_active که فقط پنل ادمین می‌نویسد؛ این Route هرگز آن را تغییر نمی‌دهد.
//   «شماره تماس پیش‌فرض» عمداً در این پاسخ نیست، دقیقاً هم‌الگو با driver/route.ts:
//   user.phoneNumber از قبل، از همان GET /api/mobile/v1/profile (فاز M01)، سمت موبایل در دسترس
//   است.
//
// POST / PATCH — بدنه: { serviceCategoryId, address, contactPhone, description, imagePaths: string[] }
//   imagePaths دقیقاً همان مسیرهای خامِ Storage (خروجی POST .../services/provider/upload-slots)
//   است، نه URL کامل — عیناً همان قرارداد marketplace/listings و transport/driver.
//   latitude/longitude عمداً همیشه null فرستاده می‌شوند: saveServiceProviderProfileAction با
//   مقدار null کلید location را در payload upsert اصلاً اضافه نمی‌کند (نگاه کنید به کامنت خودِ
//   آن تابع)، یعنی این Route هرگز موقعیت مکانیِ قبلاً ثبت‌شده (اگر باشد) را پاک/بازنویسی نمی‌کند؛
//   فرم موبایل طبق متن دقیق تسک ۳ اصلاً GPS نمی‌گیرد.
//   خروجی موفق: { success: true }
//   خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی که
//   dict.services.providerProfile.errors موبایل از قبل پوشش می‌دهد: unauthenticated،
//   invalidCategory، invalidAddress، invalidPhone، invalidImageCount، invalidImageData، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyServiceProviderProfile } from "@/lib/services/serviceProviderQueries";
import { saveServiceProviderProfileAction } from "@/app/[lang]/services/provider/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidCategory: 400,
  invalidAddress: 400,
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

  const profile = await getMyServiceProviderProfile(user.id);
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

  const result = await saveServiceProviderProfileAction({
    serviceCategoryId: typeof b.serviceCategoryId === "string" ? b.serviceCategoryId : "",
    address: typeof b.address === "string" ? b.address : "",
    contactPhone: typeof b.contactPhone === "string" ? b.contactPhone : "",
    description: typeof b.description === "string" ? b.description : "",
    imagePaths: Array.isArray(b.imagePaths) ? (b.imagePaths as string[]) : [],
    // عمداً همیشه null — نگاه کنید به یادداشت بالای فایل.
    latitude: null,
    longitude: null,
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
