// مسیر فایل: src/lib/marketplace/queries.ts
// تسک ۶ فاز ۰۲ — لایه‌ی خواندن داده برای صفحه‌ی جزئیات آگهی + بخش «آگهی‌های مشابه».
// **افزوده‌شده در تسک ۷:** searchListings — لایه‌ی خواندن داده برای فهرست/جستجوی آگهی‌ها
// (فیلتر دسته، جستجوی دستی شهر/منطقه، مرتب‌سازی بر اساس نزدیک‌ترین فاصله). هر سه تابع زیر،
// توابع Postgres تعریف‌شده در 05_phase_02_similar_listings_functions.sql و
// 06_phase_02_search_listings_function.sql را از طریق supabaseAdminClient.rpc(...) صدا می‌زنند
// (نه select مستقیم روی ستون location)، چون بازگرداندن مستقیم ستون geography از طریق کلاینت
// جاوااسکریپت شکننده است؛ توابع دیتابیس، مختصات را از قبل به دو عدد ساده (latitude/longitude)
// تبدیل می‌کنند یا مستقیماً فاصله (به متر) را برمی‌گردانند.
//
// نکته‌ی تایپ‌اسکریپتی: چون supabaseAdminClient بدون Generic نوع «Database» ساخته شده (فایل
// src/lib/supabase/server.ts هیچ تایپ خودکاری از جداول/توابع Supabase تولید نمی‌کند)، خروجی
// .rpc(...).maybeSingle() توسط TypeScript به‌صورت پیش‌فرض {} تشخیص داده می‌شود، نه شکل واقعی
// ردیف دیتابیس. برای همین بلافاصله بعد از خواندن data، با یک نوع خام محلی (RawXxxRow) و «as»
// صریح، شکل واقعی ردیف را به TypeScript اعلام می‌کنیم؛ این کار فقط برچسب‌گذاری تایپ است و هیچ
// اعتبارسنجی زمان اجرا (Runtime) را جایگزین نمی‌کند.
//
// 🔴 اصلاح (ممیزی i18n/RTL فاز M02 موبایل، تسک ۹): تابع getMyListings پایین همین فایل اضافه
// شد. Route موبایل src/app/api/mobile/v1/marketplace/my-listings/route.ts از قبل این تابع را
// از همین فایل import می‌کرد («import { getMyListings } from "@/lib/marketplace/queries";»)،
// اما تابع هرگز واقعاً نوشته نشده بود — یعنی آن Route اصلاً کامپایل نمی‌شد (خطای TypeScript
// «Module has no exported member 'getMyListings'») و صفحه‌ی «آگهی‌های من» موبایل هیچ‌وقت کار
// نمی‌کرد. برخلاف سه تابع دیگر این فایل (که با supabaseAdminClient.rpc به توابع Postgres وصل
// می‌شوند)، این تابع مستقیماً روی ستون‌های ساده‌ی جدول listings کوئری می‌زند — نیازی به تابع
// Postgres جداگانه نیست چون هیچ محاسبه‌ی مکانی (PostGIS) در کار نیست، فقط فیلتر owner_id.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** ListingDetail و ListingSummary دو فیلد تازه گرفتند:
// `videoPath` (مسیر ویدئوی اختیاری آگهی) و `ownerIsVip` (برای نمایش VipBadge کنار کارت/جزئیات
// بدون یک کوئری جداگانه‌ی اضافه — رجوع کنید به 22_phase_11_vip_membership.sql، ستون‌های تازه‌ی
// خروجی get_listing_detail/search_listings). SimilarListing/MyListing عمداً بدون تغییر ماندند
// چون طبق بند ۵ پرامپت VIP، فقط «کارت و صفحه‌ی جزئیات» نیاز به VipBadge دارند، نه بخش
// «آگهی‌های مشابه» یا «آگهی‌های من».
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type ListingDetail = {
  id: string;
  ownerId: string;
  category: string;
  title: string;
  price: number;
  address: string;
  contactPhone: string;
  description: string | null;
  images: string[];
  videoPath: string | null;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  ownerIsVip: boolean;
};

export type SimilarListing = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  createdAt: string;
  distanceMeters: number | null;
};

// شکل خلاصه‌ی هر آگهی در فهرست/جستجو (تسک ۷) — عمداً سبک‌تر از ListingDetail (بدون توضیح کامل،
// شماره تماس یا owner_id) چون فقط برای نمایش کارتی در فهرست لازم است.
export type ListingSummary = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  videoPath: string | null;
  createdAt: string;
  distanceMeters: number | null;
  ownerIsVip: boolean;
};

// شکل خروجی «آگهی‌های من» (تسک ۷ فاز M02 موبایل) — شامل وضعیت (pending/approved/deleted)،
// چون این صفحه برخلاف فهرست/جزئیات عمومی، آگهی‌های خودِ کاربر را با هر وضعیتی نشان می‌دهد.
export type MyListing = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  status: "pending" | "approved" | "deleted";
  createdAt: string;
};

// شکل خام ردیفی که تابع Postgres «get_listing_detail» برمی‌گرداند.
type RawListingDetailRow = {
  id: string;
  owner_id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  contact_phone: string;
  description: string | null;
  images: string[];
  video_path: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  owner_is_vip: boolean;
};

// شکل خام ردیفی که تابع Postgres «get_similar_listings» برمی‌گرداند.
type RawSimilarListingRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  created_at: string;
  distance_meters: number | null;
};

// شکل خام ردیفی که تابع Postgres «search_listings» برمی‌گرداند (تسک ۷).
type RawListingSummaryRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  video_path: string | null;
  created_at: string;
  distance_meters: number | null;
  owner_is_vip: boolean;
  total_count: number;
};

// شکل خام ردیفی که مستقیماً از جدول listings (بدون تابع Postgres) برای «آگهی‌های من» خوانده می‌شود.
type RawMyListingRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  status: "pending" | "approved" | "deleted";
  created_at: string;
};

// خواندن یک آگهیِ تاییدشده برای صفحه‌ی جزئیات؛ اگر آگهی وجود نداشت، حذف شده بود، یا هنوز
// «در انتظار تایید» بود، null برمی‌گردد (طبق همان قاعده‌ی Public می‌تواند فقط approved را ببیند).
export async function getApprovedListingById(id: string): Promise<ListingDetail | null> {
  const { data, error } = await supabaseAdminClient
    .rpc("get_listing_detail", { p_id: id })
    .maybeSingle();

  if (error || !data) return null;

  const row = data as RawListingDetailRow;

  return {
    id: row.id,
    ownerId: row.owner_id,
    category: row.category,
    title: row.title,
    price: Number(row.price),
    address: row.address,
    contactPhone: row.contact_phone,
    description: row.description,
    images: row.images ?? [],
    videoPath: row.video_path,
    createdAt: row.created_at,
    latitude: row.latitude,
    longitude: row.longitude,
    ownerIsVip: row.owner_is_vip ?? false,
  };
}

// آگهی‌های «مشابه» همان دسته‌بندی؛ اگر آگهی مبدا موقعیت مکانی داشت، مرتب‌سازی توسط خودِ تابع
// دیتابیس بر اساس نزدیک‌ترین فاصله (PostGIS) انجام می‌شود؛ در غیر این صورت، بر اساس جدیدترین
// آگهی (created_at) مرتب می‌شود — طبق تسک ۶.
export async function getSimilarListings(params: {
  category: string;
  excludeId: string;
  latitude: number | null;
  longitude: number | null;
  limit?: number;
}): Promise<SimilarListing[]> {
  const { data, error } = await supabaseAdminClient.rpc("get_similar_listings", {
    p_category: params.category,
    p_exclude_id: params.excludeId,
    p_lat: params.latitude,
    p_lng: params.longitude,
    p_limit: params.limit ?? 6,
  });

  if (error || !data) return [];

  const rows = data as RawSimilarListingRow[];

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    price: Number(row.price),
    address: row.address,
    images: row.images ?? [],
    createdAt: row.created_at,
    distanceMeters: row.distance_meters,
  }));
}

// فهرست/جستجوی آگهی‌ها — تسک ۷ فاز ۰۲.
// - category=null یعنی «همه‌ی دسته‌ها».
// - latitude/longitude=null یعنی کاربر GPS را نداده یا رد کرده؛ در این حالت مرتب‌سازی صرفاً
//   بر اساس جدیدترین آگهی است (distanceMeters همیشه null برمی‌گردد).
// - query یک عبارت متنی اختیاری است که هم روی آدرس و هم روی عنوان آگهی با ILIKE بررسی می‌شود؛
//   این همان «جستجوی دستی با نام شهر/منطقه» است که در صورت رد GPS جایگزین می‌شود.
// - totalCount برای تصمیم‌گیری درباره‌ی نمایش دکمه‌ی «نمایش موارد بیشتر» در سمت کلاینت است.
export async function searchListings(params: {
  category?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: ListingSummary[]; totalCount: number }> {
  const { data, error } = await supabaseAdminClient.rpc("search_listings", {
    p_category: params.category ?? null,
    // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی، دقیقاً مثل category=null.
    p_province: params.province ?? null,
    p_lat: params.latitude ?? null,
    p_lng: params.longitude ?? null,
    p_query: params.query ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (error || !data) return { items: [], totalCount: 0 };

  const rows = data as RawListingSummaryRow[];

  return {
    items: rows.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      price: Number(row.price),
      address: row.address,
      images: row.images ?? [],
      videoPath: row.video_path,
      createdAt: row.created_at,
      distanceMeters: row.distance_meters,
      ownerIsVip: row.owner_is_vip ?? false,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}

// «آگهی‌های من» (تسک ۷ فاز M02 موبایل) — فهرست آگهی‌های خودِ کاربر با هر وضعیتی (pending،
// approved، deleted)، مرتب‌شده بر اساس جدیدترین. چون RLS جدول listings با auth.uid() کار
// می‌کند (نه با نشست سفارشی OTP این پروژه)، این کوئری با supabaseAdminClient (Service Role،
// دورزننده‌ی RLS) اجرا می‌شود — دقیقاً مثل بقیه‌ی توابع نوشتن/خواندنِ محرمانه‌ی این ماژول؛
// کنترل واقعیِ «فقط آگهی‌های خودِ همین کاربر» با شرط eq("owner_id", ownerId) انجام می‌شود، نه
// با RLS. بدون نیاز به تابع Postgres جداگانه، چون هیچ محاسبه‌ی مکانی (PostGIS) در کار نیست.
export async function getMyListings(ownerId: string): Promise<MyListing[]> {
  const { data, error } = await supabaseAdminClient
    .from("listings")
    .select("id, category, title, price, address, images, status, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as RawMyListingRow[];

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    price: Number(row.price),
    address: row.address,
    images: row.images ?? [],
    status: row.status,
    createdAt: row.created_at,
  }));
}