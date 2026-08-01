// مسیر فایل: src/lib/realEstate/queries.ts
// تسک ۶ فاز ۰۵ — لایه‌ی خواندن داده برای صفحه‌ی جزئیات آگهی ملک + بخش «آگهی‌های مشابه» + فهرست/
// جستجوی آگهی‌های ملک (مرتب‌سازی بر اساس نزدیک‌ترین فاصله، PostGIS). دقیقاً هم‌الگو با
// src/lib/marketplace/queries.ts (فاز ۰۲، تسک ۶/۷): هر سه تابع زیر، توابع Postgres تعریف‌شده در
// 18_phase_05_real_estate_functions.sql را از طریق supabaseAdminClient.rpc(...) صدا می‌زنند (نه
// select مستقیم روی ستون location)، چون بازگرداندن مستقیم ستون geography از طریق کلاینت
// جاوااسکریپت شکننده است؛ توابع دیتابیس، مختصات را از قبل به دو عدد ساده (latitude/longitude)
// تبدیل می‌کنند یا مستقیماً فاصله (به متر) را برمی‌گردانند.
//
// تفاوت با ماژول کالا: جدول real_estate ستون title یا contact_phone ندارد (تسک ۴ همین فاز)؛
// شماره تماس آگهی‌دهنده در get_real_estate_detail با Join به جدول users خوانده می‌شود، پس فقط در
// نوع RealEstateDetail وجود دارد، نه در RealEstateSummary/SimilarRealEstate (که فقط برای کارت
// فهرست/مشابه لازم است).
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** RealEstateDetail و RealEstateSummary دو فیلد تازه گرفتند:
// `videoPath` و `ownerIsVip` — دقیقاً همان تصمیم و دلیلی که برای ListingDetail/ListingSummary در
// src/lib/marketplace/queries.ts گرفته شد. SimilarRealEstate عمداً بدون تغییر ماند (طبق بند ۵
// پرامپت VIP، فقط «کارت و صفحه‌ی جزئیات» نیاز به VipBadge دارند).
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type RealEstateDetail = {
  id: string;
  ownerId: string;
  propertyType: string;
  dealType: string;
  price: number;
  address: string;
  description: string | null;
  images: string[];
  videoPath: string | null;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  ownerIsVip: boolean;
};

export type SimilarRealEstate = {
  id: string;
  propertyType: string;
  dealType: string;
  price: number;
  address: string;
  images: string[];
  createdAt: string;
  distanceMeters: number | null;
};

// شکل خلاصه‌ی هر آگهی ملک در فهرست/جستجو — عمداً سبک‌تر از RealEstateDetail (بدون توضیح کامل،
// شماره تماس یا owner_id) چون فقط برای نمایش کارتی در فهرست لازم است.
export type RealEstateSummary = {
  id: string;
  propertyType: string;
  dealType: string;
  price: number;
  address: string;
  images: string[];
  videoPath: string | null;
  createdAt: string;
  distanceMeters: number | null;
  ownerIsVip: boolean;
};

// شکل خام ردیفی که تابع Postgres «get_real_estate_detail» برمی‌گرداند.
type RawRealEstateDetailRow = {
  id: string;
  owner_id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  description: string | null;
  images: string[];
  video_path: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string;
  owner_is_vip: boolean;
};

// شکل خام ردیفی که تابع Postgres «get_similar_real_estate» برمی‌گرداند.
type RawSimilarRealEstateRow = {
  id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  images: string[];
  created_at: string;
  distance_meters: number | null;
};

// شکل خام ردیفی که تابع Postgres «search_real_estate» برمی‌گرداند.
type RawRealEstateSummaryRow = {
  id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  images: string[];
  video_path: string | null;
  created_at: string;
  distance_meters: number | null;
  owner_is_vip: boolean;
  total_count: number;
};

// خواندن یک آگهیِ ملکِ تاییدشده برای صفحه‌ی جزئیات؛ اگر آگهی وجود نداشت، حذف شده بود، یا هنوز
// «در انتظار تایید» بود، null برمی‌گردد (طبق همان قاعده‌ی Public می‌تواند فقط approved را ببیند).
export async function getApprovedRealEstateById(id: string): Promise<RealEstateDetail | null> {
  const { data, error } = await supabaseAdminClient
    .rpc("get_real_estate_detail", { p_id: id })
    .maybeSingle();

  if (error || !data) return null;

  const row = data as RawRealEstateDetailRow;

  return {
    id: row.id,
    ownerId: row.owner_id,
    propertyType: row.property_type,
    dealType: row.deal_type,
    price: Number(row.price),
    address: row.address,
    description: row.description,
    images: row.images ?? [],
    videoPath: row.video_path,
    createdAt: row.created_at,
    latitude: row.latitude,
    longitude: row.longitude,
    contactPhone: row.contact_phone,
    ownerIsVip: row.owner_is_vip ?? false,
  };
}

// آگهی‌های «مشابه» همان نوع ملک و همان نوع معامله؛ اگر آگهی مبدا موقعیت مکانی داشت، مرتب‌سازی
// توسط خودِ تابع دیتابیس بر اساس نزدیک‌ترین فاصله (PostGIS) انجام می‌شود؛ در غیر این صورت، بر
// اساس جدیدترین آگهی (created_at) مرتب می‌شود — طبق تسک ۶.
export async function getSimilarRealEstate(params: {
  propertyType: string;
  dealType: string;
  excludeId: string;
  latitude: number | null;
  longitude: number | null;
  limit?: number;
}): Promise<SimilarRealEstate[]> {
  const { data, error } = await supabaseAdminClient.rpc("get_similar_real_estate", {
    p_property_type: params.propertyType,
    p_deal_type: params.dealType,
    p_exclude_id: params.excludeId,
    p_lat: params.latitude,
    p_lng: params.longitude,
    p_limit: params.limit ?? 6,
  });

  if (error || !data) return [];

  const rows = data as RawSimilarRealEstateRow[];

  return rows.map((row) => ({
    id: row.id,
    propertyType: row.property_type,
    dealType: row.deal_type,
    price: Number(row.price),
    address: row.address,
    images: row.images ?? [],
    createdAt: row.created_at,
    distanceMeters: row.distance_meters,
  }));
}

// فهرست/جستجوی آگهی‌های ملک — تسک ۶ فاز ۰۵.
// - propertyType/dealType=null یعنی «همه».
// - latitude/longitude=null یعنی کاربر GPS را نداده یا رد کرده؛ در این حالت مرتب‌سازی صرفاً بر
//   اساس جدیدترین آگهی است (distanceMeters همیشه null برمی‌گردد).
// - query یک عبارت متنی اختیاری است که روی آدرس با ILIKE بررسی می‌شود (real_estate ستون title
//   ندارد، برخلاف listings)؛ این همان «جستجوی دستی با نام شهر/منطقه» است که در صورت رد GPS
//   جایگزین می‌شود.
// - totalCount برای تصمیم‌گیری درباره‌ی نمایش دکمه‌ی «نمایش موارد بیشتر» در سمت کلاینت است.
export async function searchRealEstate(params: {
  propertyType?: string | null;
  dealType?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: RealEstateSummary[]; totalCount: number }> {
  const { data, error } = await supabaseAdminClient.rpc("search_real_estate", {
    p_property_type: params.propertyType ?? null,
    p_deal_type: params.dealType ?? null,
    // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی.
    p_province: params.province ?? null,
    p_lat: params.latitude ?? null,
    p_lng: params.longitude ?? null,
    p_query: params.query ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (error || !data) return { items: [], totalCount: 0 };

  const rows = data as RawRealEstateSummaryRow[];

  return {
    items: rows.map((row) => ({
      id: row.id,
      propertyType: row.property_type,
      dealType: row.deal_type,
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