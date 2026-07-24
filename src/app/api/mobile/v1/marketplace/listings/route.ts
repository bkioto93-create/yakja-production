// مسیر فایل: src/app/api/mobile/v1/marketplace/listings/route.ts
// فاز M02 موبایل، تسک ۵ (نیمه‌ی دوم) — نسخه‌ی HTTP-محورِ همان ثبت نهایی آگهی که وب با
// createListingAction (src/app/[lang]/listings/new/actions.ts، تسک ۴/۵ فاز ۰۲) از قبل دارد.
//
// دقیقاً هم‌الگو با upload-slots/route.ts (همین پوشه): صفر منطق تجاری تازه، فقط createListingAction
// موجود صدا زده می‌شود — اعتبارسنجی دسته/عنوان/قیمت/آدرس/شماره/تعداد عکس، تبدیل مختصات به
// geography، و حتی پاک‌سازی خودکار عکس‌های یتیم در صورت شکست insert، همه از قبل داخل خودِ آن
// اکشن پیاده‌سازی و تست شده‌اند.
//
// ⚠️ اصلاح نسبت به نسخه‌ی حدسی قبلی: دو نکته‌ی مهم که فقط با دیدن کد واقعی actions.ts معلوم شد
// (و باعث شد سمت موبایل هم اصلاح شود — فایل‌های پیوست):
//   ۱. فیلد آرایه‌ی عکس‌ها در این اکشن `imagePaths` نام دارد، نه `images`، و باید حاوی
//      همان «مسیر» خام Storage باشد (مثلاً "owner-uuid/167000_0.jpg") — نه URL کامل. ستون
//      listings.images هم دقیقاً همین مسیرهای خام را ذخیره می‌کند؛ ساخت URL کامل برای نمایش
//      همیشه در لحظه‌ی خواندن انجام می‌شود (src/lib/marketplace/images.ts::getListingImageUrl).
//   ۲. فیلد price باید رشته (string) باشد، نه عدد — چون خودِ اکشن با toAsciiDigits ارقام
//      فارسی/عربی احتمالی را قبل از Number() تبدیل می‌کند.
//
// بدنه‌ی درخواست: { category, title, price: string, address, contactPhone, description,
//   imagePaths: string[], latitude?, longitude? }
// خروجی موفق: { success: true }
// خروجی ناموفق: { success: false, error } — کدها دقیقاً همان‌هایی هستند که
//   dict.marketplace.wizard.errors موبایل از قبل پوشش می‌دهد: unauthenticated، invalidCategory،
//   invalidTitle، invalidPrice، invalidAddress، invalidPhone، invalidImageCount،
//   invalidImageData، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { createListingAction } from "@/app/[lang]/listings/new/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidCategory: 400,
  invalidTitle: 400,
  invalidPrice: 400,
  invalidAddress: 400,
  invalidPhone: 400,
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

  const result = await createListingAction({
    category: typeof b.category === "string" ? b.category : "",
    title: typeof b.title === "string" ? b.title : "",
    price: typeof b.price === "string" ? b.price : String(b.price ?? ""),
    address: typeof b.address === "string" ? b.address : "",
    contactPhone: typeof b.contactPhone === "string" ? b.contactPhone : "",
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