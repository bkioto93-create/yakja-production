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
// **به‌روزرسانی (هم‌سازی موبایل با وب — قابلیت استوری):** طبق همان استدلال بالا («تازه‌ترین
// استوری‌ها» هم به Join با users برای نام مالک نیاز دارد، پس Anon Key مستقیم کافی نیست)، سومین
// منبع به همین Promise.all اضافه شد: getLatestStoriesForHome موجود (src/lib/home/homeQueries.ts
// → src/lib/stories/storyQueries.ts، همان تابعی که ردیف «تازه‌ترین استوری‌ها»ی خودِ صفحه‌ی
// اصلیِ وب هم استفاده می‌کند). عمداً به همین یک Route اضافه شد، نه یک Route جداگانه‌ی
// `/home/stories` — چون بند ۵.۳ سند راهبردی موبایل صریحاً «کاهش تعداد درخواست‌های شبکه برای
// اینترنت ضعیف» را اولویت می‌داند؛ این‌طور صفحه‌ی اصلیِ موبایل هم‌چنان با یک تماس شبکه‌ی واحد هر
// پنج بخش (راننده/متخصص/کالا/ملک/استوری) را می‌گیرد، نه شش. خروجی mediaUrl از قبل کامل است
// (getLatestStoriesForHome خودش getStoryMediaUrl را داخلی صدا می‌زند)، پس سمت موبایل به هیچ
// تبدیل مسیر خامی نیاز ندارد — برخلاف drivers/providers که images هنوز مسیر خامِ Storage است.
//
// **بدون نیاز به احراز هویت** — دقیقاً مثل GET /api/mobile/v1/users/[id] (فاز M06)؛ این داده‌ی
// صفحه‌ی اصلی برای بازدیدکننده‌ی مهمان هم نمایش داده می‌شود.
//
// Query param: ?limit=10 (اختیاری؛ پیش‌فرض ۱۰، سقف ۲۰) — برای راننده/متخصص.
// Query param: ?storiesLimit=10 (اختیاری؛ پیش‌فرض ۱۰، سقف ۲۰) — جدا از limit بالا، چون
// STORIES_SHOWCASE_LIMIT در وب هم عدد جداگانه‌ای دارد (رجوع کنید به src/app/[lang]/page.tsx).
// Query param: ?province=kabul (اختیاری؛ پیش‌فرض بدون فیلتر = همه‌ی افغانستان) — فقط روی
// راننده/متخصص اثر دارد؛ استوری‌ها سراسری‌اند (بدون فیلتر ولایتی، دقیقاً مثل ردیف استوریِ وب).
// خروجی: { drivers: HomeDriverPreview[], providers: HomeProviderPreview[], stories: HomeStoryPreview[] }
// (images راننده/متخصص همان مسیرهای خامِ Storage است، نه URL کامل — تبدیل سمت موبایل، در
// lib/home/api.ts، دقیقاً هم‌الگو با بقیه‌ی ماژول‌ها. mediaUrl استوری‌ها، طبق بالا، از قبل کامل است.)
import "server-only";
import { NextResponse } from "next/server";
import {
  getNewestDriversForHome,
  getNewestProvidersForHome,
  getLatestStoriesForHome,
} from "@/lib/home/homeQueries";
import { isValidProvince } from "@/lib/provinces";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 10;

  const rawStoriesLimit = Number(searchParams.get("storiesLimit"));
  const storiesLimit =
    Number.isFinite(rawStoriesLimit) && rawStoriesLimit > 0 ? Math.min(rawStoriesLimit, 20) : 10;

  const rawProvince = searchParams.get("province");
  const province = rawProvince && isValidProvince(rawProvince) ? rawProvince : null;

  const [drivers, providers, stories] = await Promise.all([
    getNewestDriversForHome(limit, province),
    getNewestProvidersForHome(limit, province),
    getLatestStoriesForHome(storiesLimit),
  ]);

  return NextResponse.json({ drivers, providers, stories });
}