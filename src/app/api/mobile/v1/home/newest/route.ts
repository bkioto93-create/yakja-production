// مسیر فایل: src/app/api/mobile/v1/home/newest/route.ts
// چک‌آپ هم‌ترازی صفحه‌ی اصلی موبایل با نسخه‌ی تازه‌طراحی‌شده‌ی وب — نسخه‌ی HTTP-محورِ همان دو
// کوئریِ «رانندگان/متخصصین تازه» که وب با getNewestDriversForHome/getNewestProvidersForHome
// (src/lib/home/homeQueries.ts) از قبل دارد و برای صفحه‌ی اصلی وب تست شده.
//
// چرا این دو مورد (برخلاف «آگهی‌های تازه‌ی کالا/ملک») به یک Route تازه نیاز داشتند: آن دو با
// searchListings/searchRealEstate (توابع Postgres عمومی، از قبل با grant به anon) کار می‌کنند —
// موبایل می‌تواند مستقیم با Anon Key صدایشان بزند (lib/marketplace/api.ts، lib/realEstate/api.ts،
// بدون تغییر). اما «تازه‌ترین راننده/متخصص» هیچ تابع RPC عمومی ندارد — خودِ homeQueries.ts وب هم
// مستقیماً با supabaseAdminClient (Service Role) و دو Join درون‌حافظه‌ای (به users برای نام
// مالک؛ برای متخصصین، به service_categories هم) این را می‌خواند، دقیقاً هم‌الگو با
// adminDriverQueries.ts/adminServiceProviderQueries.ts — پس فقط سرور (نه Anon Key) می‌تواند این
// را بخواند؛ دقیقاً همان دلیلی که پروفایل عمومی کاربر (فاز M06) هم به پل موبایل نیاز داشت.
//
// صفر منطق تجاری تازه — فقط getNewestDriversForHome و getNewestProvidersForHome موجود (که خودشان
// با unstable_cache سه‌دقیقه‌ای کش شده‌اند، طبق کامنت کارفرما «همیشه بحث کش برای لود سریع در
// اینترنت ضعیف» — این کش رایگان برای موبایل هم اعمال می‌شود) با هم صدا زده می‌شوند.
//
// **بدون نیاز به احراز هویت** — دقیقاً مثل GET /api/mobile/v1/users/[id] (فاز M06)؛ این داده‌ی
// صفحه‌ی اصلی برای بازدیدکننده‌ی مهمان هم نمایش داده می‌شود.
//
// Query param: ?limit=10 (اختیاری؛ پیش‌فرض ۱۰، سقف ۲۰ — دقیقاً همان سقفی که خودِ اکشن‌های وب هم
// برای بنرهای مشابه استفاده می‌کنند؛ محافظت در برابر درخواست بیش‌ازحد از سمت کلاینت).
//
// رفع باگ دیپلوی (فاز ۱۰ — قابلیت ولایت): بعد از افزودن فیلتر ولایتی به صفحه‌ی اصلی وب،
// getNewestDriversForHome/getNewestProvidersForHome یک آرگومان دومِ الزامی (province) گرفتند و
// بیلد Vercel شکست («Expected 2 arguments, but got 1»)، چون این Route موبایل هنوز فقط با ۱
// آرگومان صدایشان می‌زد. راه‌حل: یک ?province=kabul اختیاری هم اینجا پذیرفته می‌شود (اگر اپ
// موبایل هنوز آن را نمی‌فرستد، مقدار پیش‌فرض null یعنی «همه‌ی افغانستان» است — دقیقاً همان رفتار
// قبل از فاز ۱۰، بدون هیچ تغییر رفتاری برای نسخه‌ی فعلی اپ موبایل)؛ اعتبارسنجی‌اش هم دقیقاً
// هم‌الگو با تمام Server Actionهای وب (isValidProvince).
// Query param: ?province=kabul (اختیاری؛ پیش‌فرض بدون فیلتر = همه‌ی افغانستان)
// خروجی: { drivers: HomeDriverPreview[], providers: HomeProviderPreview[] }
// (images همان مسیرهای خامِ Storage است، نه URL کامل — تبدیل سمت موبایل، در lib/home/api.ts،
// دقیقاً هم‌الگو با بقیه‌ی ماژول‌ها.)
import "server-only";
import { NextResponse } from "next/server";
import {
  getNewestDriversForHome,
  getNewestProvidersForHome,
} from "@/lib/home/homeQueries";
import { isValidProvince } from "@/lib/provinces";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 10;

  const rawProvince = searchParams.get("province");
  const province = rawProvince && isValidProvince(rawProvince) ? rawProvince : null;

  const [drivers, providers] = await Promise.all([
    getNewestDriversForHome(limit, province),
    getNewestProvidersForHome(limit, province),
  ]);

  return NextResponse.json({ drivers, providers });
}