// مسیر فایل: src/app/api/mobile/v1/real-estate/listings/route.ts
// فاز M05 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان ثبت نهایی آگهی ملک که وب با
// createRealEstateListingAction (src/app/[lang]/real-estate/new/actions.ts، تسک ۴/۵ فاز ۰۵) از
// قبل دارد و برای فرم وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/marketplace/listings/route.ts (فاز M02 موبایل، تسک ۵):
// صفر منطق تجاری تازه — فقط createRealEstateListingAction موجود صدا زده می‌شود؛ اعتبارسنجی نوع
// ملک/نوع معامله/ولایت/قیمت/آدرس/تعداد عکس، تبدیل مختصات به geography، و پاک‌سازی خودکار عکس‌های
// یتیم در صورت شکست insert، همه از قبل داخل خودِ آن اکشن پیاده‌سازی و تست شده‌اند.
//
// ⚠️ رفع باگ دیپلوی (فاز ۱۰ — قابلیت ولایت): بعد از افزودن فیلد الزامی province به
// createRealEstateListingAction، بیلد Vercel شکست («Property 'province' is missing»)، چون این
// Route موبایل هنوز آن را نمی‌فرستاد. راه‌حل: یک فیلد province هم از بدنه‌ی درخواست خوانده و
// مستقیماً به اکشن پاس داده می‌شود — اعتبارسنجی خودِ مقدار (isValidProvince) از قبل داخل
// createRealEstateListingAction انجام می‌شود.
//
// بدنه‌ی درخواست: { propertyType, dealType, province, price: string, address, description,
//   imagePaths: string[], latitude?, longitude? }
// خروجی موفق: { success: true }
// خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی که
//   dict.realEstate.wizard.errors موبایل از قبل پوشش می‌دهد: unauthenticated،
//   invalidPropertyType، invalidDealType، invalidProvince، invalidPrice، invalidAddress،
//   invalidImageCount، invalidImageData، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { createRealEstateListingAction } from "@/app/[lang]/real-estate/new/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidPropertyType: 400,
  invalidDealType: 400,
  invalidProvince: 400,
  invalidPrice: 400,
  invalidAddress: 400,
  invalidImageCount: 400,
  invalidImageData: 400,
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

  const result = await createRealEstateListingAction({
    propertyType: typeof b.propertyType === "string" ? b.propertyType : "",
    dealType: typeof b.dealType === "string" ? b.dealType : "",
    province: typeof b.province === "string" ? b.province : "",
    price: typeof b.price === "string" ? b.price : String(b.price ?? ""),
    address: typeof b.address === "string" ? b.address : "",
    description: typeof b.description === "string" ? b.description : "",
    imagePaths: Array.isArray(b.imagePaths) ? (b.imagePaths as string[]) : [],
    latitude: typeof b.latitude === "number" ? b.latitude : null,
    longitude: typeof b.longitude === "number" ? b.longitude : null,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true });
}