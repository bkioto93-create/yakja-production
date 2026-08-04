// مسیر فایل: src/lib/home/homeQueries.ts
// تسک بازطراحی صفحه‌ی اصلی — لایه‌ی خواندنِ داده برای چهار بنر پیش‌رونده‌ی افقی («رانندگان تازه»،
// «متخصصین تازه»، «آگهی‌های تازه‌ی کالا»، «آگهی‌های تازه‌ی ملک»).
//
// دو تصمیم مهم:
//
// ۱) **کَش کردن با unstable_cache (بند صریح کارفرما: «همیشه بحث کش برای لود سریع در اینترنت
//    ضعیف»):** چون src/app/[lang]/layout.tsx از cookies() استفاده می‌کند (برای وضعیت مودال سلب
//    مسئولیت و پیشنهاد نصب PWA)، کل زیرشاخه‌ی [lang] از قبل «Dynamic» است و کش خودکار صفحه‌ی
//    Next.js (Full Route Cache) روی آن اثر ندارد. برای همین، این چهار کوئری مستقیماً با
//    unstable_cache کش می‌شوند (۳ دقیقه/۱۸۰ ثانیه) — یعنی حتی در رندر پویا، این کوئری‌ها فقط هر
//    ۳ دقیقه یک‌بار واقعاً به Supabase می‌رسند، نه در هر بار باز شدن صفحه توسط هر کاربر؛ دقیقاً
//    همان چیزی که برای بارگذاری سریع در مناطق با اینترنت ضعیف لازم است.
//
// ۲) **بدون هیچ تابع/تغییر جدید در دیتابیس (Postgres RPC):** برخلاف driverQueries.ts و
//    serviceProviderQueries.ts (که برای فهرست عمومی «فعال» از توابع RPC با محاسبه‌ی فاصله‌ی
//    PostGIS استفاده می‌کنند)، اینجا نیازی به محاسبه‌ی مکانی نیست — فقط «جدیدترین‌ها» لازم است.
//    برای همین، دقیقاً هم‌الگو با src/lib/transport/adminDriverQueries.ts و
//    src/lib/services/adminServiceProviderQueries.ts، یک select ساده + join درون‌حافظه‌ای با
//    جدول users (برای نام مالک) کافی است؛ بدون نیاز به هیچ migration یا تابع SQL تازه برای
//    رانندگان. برای متخصصین، یک join دوم درون‌حافظه‌ای با service_categories هم لازم است (برای
//    نام و آیکون تخصص) — دقیقاً هم‌الگو با adminServiceProviderQueries.ts.
//
//    یک نکته‌ی واقعی که باید بدانی: جدول service_providers برخلاف drivers ستون created_at ندارد
//    (طبق یادداشت خودِ adminServiceProviderQueries.ts)، پس مرتب‌سازی «جدیدترین» آن فعلاً روی id
//    انجام می‌شود که چون id یک UUID تصادفی است، ترتیب واقعاً «جدیدترین اول» را تضمین نمی‌کند. اگر
//    می‌خواهی این را واقعاً دقیق کنی، فایل SQL پیوست‌شده
//    (SUPABASE_MIGRATION_service_providers_created_at.sql) را یک‌بار در Supabase SQL Editor اجرا
//    کن؛ بعد از آن، خط ".order("id", ...)" پایین همین فایل را به ".order("created_at", ...)"
//    تغییر بده. تا وقتی این کار را نکرده‌ای، کد همین‌طور که هست کار می‌کند، فقط ترتیب «تازگی»
//    متخصصین دقیق نخواهد بود.
import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { VehicleTypeId } from "@/lib/transport/vehicleTypes";
import { searchListings, type ListingSummary } from "@/lib/marketplace/queries";
import { searchRealEstate, type RealEstateSummary } from "@/lib/realEstate/queries";
import { fetchLatestStoriesForHome, type HomeStoryPreview } from "@/lib/stories/storyQueries";

const HOME_CACHE_REVALIDATE_SECONDS = 180;

// ---------------------------------------------------------------------------
// رانندگان تازه
// ---------------------------------------------------------------------------
export type HomeDriverPreview = {
  id: string;
  ownerName: string | null;
  vehicleType: VehicleTypeId;
  images: string[];
};

async function fetchNewestDriversForHome(limit: number, province: string | null): Promise<HomeDriverPreview[]> {
  let queryBuilder = supabaseAdminClient
    .from("drivers")
    .select("id, owner_id, vehicle_type, images")
    .eq("is_active", true);
  // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی.
  if (province) queryBuilder = queryBuilder.eq("province", province);
  const { data, error } = await queryBuilder.order("created_at", { ascending: false }).limit(limit);

  if (error || !data || data.length === 0) return [];

  const ownerIds = Array.from(new Set(data.map((row) => row.owner_id as string)));
  const { data: owners } = await supabaseAdminClient
    .from("users")
    .select("id, name")
    .in("id", ownerIds);
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  return data.map((row) => ({
    id: row.id as string,
    ownerName: ownerById.get(row.owner_id as string)?.name ?? null,
    vehicleType: row.vehicle_type as VehicleTypeId,
    images: (row.images as string[] | null) ?? [],
  }));
}

// فاز ۱۰: province هم به‌عنوان آرگومان تابع (نه فقط بخشی از آرایه‌ی کلید) پاس داده می‌شود؛
// unstable_cache خودش آرگومان‌های واقعی فراخوانی را هش کرده و به کلید کش اضافه می‌کند، پس هر
// ولایت خودکار کش جداگانه‌ی خودش را می‌گیرد، بدون نیاز به تغییر آرایه‌ی کلید.
export const getNewestDriversForHome = unstable_cache(
  fetchNewestDriversForHome,
  ["home-newest-drivers"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: ["home-drivers"] }
);

// ---------------------------------------------------------------------------
// متخصصین تازه
// ---------------------------------------------------------------------------
export type HomeProviderPreview = {
  id: string;
  ownerName: string | null;
  categoryNameFa: string | null;
  categoryNamePs: string | null;
  categoryIconSource: "builtin" | "custom";
  categoryIconKey: string | null;
  categoryIconUrl: string | null;
  images: string[];
};

async function fetchNewestProvidersForHome(limit: number, province: string | null): Promise<HomeProviderPreview[]> {
  let queryBuilder = supabaseAdminClient
    .from("service_providers")
    .select("id, owner_id, service_category_id, images")
    .eq("is_active", true);
  // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی.
  if (province) queryBuilder = queryBuilder.eq("province", province);
  // 🔶 رجوع کنید به یادداشت بالای فایل: بعد از اجرای SUPABASE_MIGRATION_service_providers_created_at.sql
  // این خط را به .order("created_at", { ascending: false }) تغییر بده تا واقعاً «جدیدترین‌ها» باشد.
  const { data, error } = await queryBuilder.order("id", { ascending: false }).limit(limit);

  if (error || !data || data.length === 0) return [];

  const ownerIds = Array.from(new Set(data.map((row) => row.owner_id as string)));
  const categoryIds = Array.from(new Set(data.map((row) => row.service_category_id as string)));

  const [ownersResult, categoriesResult] = await Promise.all([
    supabaseAdminClient.from("users").select("id, name").in("id", ownerIds),
    supabaseAdminClient
      .from("service_categories")
      .select("id, name_fa, name_ps, icon_source, icon_key, icon_url")
      .in("id", categoryIds),
  ]);

  const ownerById = new Map((ownersResult.data ?? []).map((o) => [o.id, o]));
  const categoryById = new Map((categoriesResult.data ?? []).map((c) => [c.id, c]));

  return data.map((row) => {
    const category = categoryById.get(row.service_category_id as string);
    return {
      id: row.id as string,
      ownerName: ownerById.get(row.owner_id as string)?.name ?? null,
      categoryNameFa: category?.name_fa ?? null,
      categoryNamePs: category?.name_ps ?? null,
      categoryIconSource: (category?.icon_source === "custom" ? "custom" : "builtin") as
        | "builtin"
        | "custom",
      categoryIconKey: category?.icon_key ?? null,
      categoryIconUrl: category?.icon_url ?? null,
      images: (row.images as string[] | null) ?? [],
    };
  });
}

export const getNewestProvidersForHome = unstable_cache(
  fetchNewestProvidersForHome,
  ["home-newest-providers"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: ["home-providers"] }
);

// ---------------------------------------------------------------------------
// آگهی‌های تازه‌ی کالا — بازاستفاده‌ی مستقیم از searchListings موجود (فاز ۰۲)، بدون هیچ فیلتر
// دسته/مکان، که طبق مستندات خودِ آن تابع یعنی مرتب‌سازی بر اساس جدیدترین آگهی.
// ---------------------------------------------------------------------------
async function fetchNewestListingsForHome(limit: number, province: string | null): Promise<ListingSummary[]> {
  const { items } = await searchListings({ limit, province });
  return items;
}

export const getNewestListingsForHome = unstable_cache(
  fetchNewestListingsForHome,
  ["home-newest-listings"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: ["home-listings"] }
);

// ---------------------------------------------------------------------------
// آگهی‌های تازه‌ی ملک — دقیقاً همان الگو، بازاستفاده از searchRealEstate موجود (فاز ۰۵).
// ---------------------------------------------------------------------------
async function fetchNewestRealEstateForHome(limit: number, province: string | null): Promise<RealEstateSummary[]> {
  const { items } = await searchRealEstate({ limit, province });
  return items;
}

export const getNewestRealEstateForHome = unstable_cache(
  fetchNewestRealEstateForHome,
  ["home-newest-real-estate"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: ["home-real-estate"] }
);

// ---------------------------------------------------------------------------
// قابلیت استوری — ردیف «تازه‌ترین استوری‌ها». منطق خواندن خام در src/lib/stories/storyQueries.ts
// است (چون به دامنه‌ی «استوری» تعلق دارد، نه دامنه‌ی «صفحه‌ی اصلی»)؛ اینجا فقط دقیقاً هم‌الگو با
// بقیه‌ی این فایل، کش می‌شود.
//
// تفاوت با چهار بخش بالا: چون استوری ذاتاً محتوای زمان‌محور/ناپایدار است (بر خلاف ثبت یک راننده/
// آگهی تازه)، علاوه بر این کش ۳ دقیقه‌ای، بلافاصله بعد از ثبت یک استوری تازه هم همین تگ
// («home-stories») به‌طور صریح باطل می‌شود (رجوع کنید به revalidateTag در
// src/app/[lang]/profile/storyActions.ts) — یعنی در عمل، استوری تازه معمولاً خیلی زودتر از ۳
// دقیقه در صفحه‌ی اصلی ظاهر می‌شود، نه این‌که کاربر واقعاً ۳ دقیقه منتظر بماند.
export const getLatestStoriesForHome = unstable_cache(
  fetchLatestStoriesForHome,
  ["home-latest-stories"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: ["home-stories"] }
);

export type { HomeStoryPreview };