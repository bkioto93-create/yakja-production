// مسیر فایل: src/lib/services/serviceProviderQueries.ts
// تسک ۶ فاز ۰۴ — لایه‌ی خواندن پروفایل متخصصِ خودِ کاربرِ واردشده. دقیقاً هم‌الگو با
// src/lib/transport/driverQueries.ts (فاز ۰۳، تسک ۴): یک select ساده کافی است چون ستون geography
// (location) در این مرحله (تسک ۶) نه خوانده و نه نمایش داده می‌شود — فقط ستون‌های ساده‌ی پروفایل
// (تخصص، آدرس، شماره تماس، توضیح) لازم است.
//
// **به‌روزرسانی تسک ۵ فاز ۰۷:** فیلد `isActive` به MyServiceProviderProfile اضافه شد. این ستون
// (رجوع کنید به 19_phase_07_service_providers_is_active.sql) برخلاف drivers.is_active، هرگز توسط
// خودِ متخصص در این صفحه تغییر داده نمی‌شود — فقط پنل ادمین آن را می‌نویسد؛ اینجا فقط برای نمایشِ
// یک اعلانِ صرفاً اطلاع‌رسانی (بدون سوییچ) در ServiceProviderProfileClient.tsx خوانده می‌شود، تا
// متخصصی که ادمین پروفایلش را پنهان کرده، بی‌خبر نماند که چرا دیگر تماسی دریافت نمی‌کند.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** ستون service_providers.images
// (20_phase_08b_transport_services_photos.sql) به هر دو تابع این فایل اضافه شد — هم به
// getMyServiceProviderProfile (برای نمایش عکس‌های موجود در حالت ویرایش) و هم به تابع Postgres
// get_active_service_providers که getActiveServiceProviders از آن استفاده می‌کند.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type MyServiceProviderProfile = {
  id: string;
  serviceCategoryId: string;
  contactPhone: string;
  address: string;
  description: string | null;
  isActive: boolean;
  images: string[];
};

// پروفایل متخصصِ خودِ کاربرِ واردشده را برمی‌گرداند؛ اگر هنوز پروفایلی نساخته (کاربر تازه به این
// صفحه آمده)، null برمی‌گردد — یعنی فرم باید در «حالت ثبت» (نه ویرایش) نمایش داده شود — دقیقاً
// هم‌الگو با getMyDriverProfile.
export async function getMyServiceProviderProfile(
  ownerId: string
): Promise<MyServiceProviderProfile | null> {
  const { data, error } = await supabaseAdminClient
    .from("service_providers")
    .select("id, service_category_id, contact_phone, address, description, is_active, images")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    serviceCategoryId: data.service_category_id,
    contactPhone: data.contact_phone,
    address: data.address,
    description: data.description,
    isActive: data.is_active,
    images: data.images ?? [],
  };
}

// تسک ۷ فاز ۰۴ — فهرست/جستجوی عمومی متخصصین. دقیقاً هم‌الگو با searchListings (فاز ۰۲، تسک ۷)
// و getActiveDrivers (فاز ۰۳، تسک ۸): از تابع Postgres get_active_service_providers از طریق
// rpc(...) استفاده می‌شود، نه select مستقیم، چون بازگرداندن ستون geography مستقیماً شکننده است و
// چون فیلتر/جستجو/مرتب‌سازی مکانی باید در سطح دیتابیس (PostGIS) انجام شود.
export type ActiveServiceProviderSummary = {
  id: string;
  serviceCategoryId: string;
  categoryNameFa: string;
  categoryNamePs: string;
  categoryIconSource: "builtin" | "custom";
  categoryIconKey: string | null;
  categoryIconUrl: string | null;
  contactPhone: string;
  address: string;
  description: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
};

// شکل خام ردیفی که تابع Postgres «get_active_service_providers» برمی‌گرداند.
type RawActiveServiceProviderRow = {
  id: string;
  service_category_id: string;
  category_name_fa: string;
  category_name_ps: string;
  category_icon_source: string;
  category_icon_key: string | null;
  category_icon_url: string | null;
  contact_phone: string;
  address: string;
  description: string | null;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  total_count: number;
};

// - category=null یعنی «همه‌ی تخصص‌ها».
// - latitude/longitude=null یعنی کاربر GPS را نداده یا رد کرده؛ در این حالت مرتب‌سازی بدون
//   فاصله انجام می‌شود (distanceMeters همیشه null برمی‌گردد).
// - query یک عبارت متنی اختیاری است که روی آدرس متخصص با ILIKE بررسی می‌شود؛ این همان «جستجوی
//   دستی شهر/منطقه» است که طبق متن دقیق تسک ۷، در صورت رد GPS جایگزین می‌شود (و همیشه، حتی با
//   GPS فعال هم، در دسترس می‌ماند — دقیقاً هم‌الگو با ListingsSearch.tsx فاز ۰۲).
// - totalCount برای تصمیم‌گیری درباره‌ی نمایش دکمه‌ی «نمایش موارد بیشتر» در سمت کلاینت است.
// - تابع Postgres خودش از تسک ۵ فاز ۰۷ فقط پروفایل‌های is_active=true را برمی‌گرداند (رجوع کنید
//   به 19_phase_07_service_providers_is_active.sql).
export async function getActiveServiceProviders(params: {
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: ActiveServiceProviderSummary[]; totalCount: number }> {
  const { data, error } = await supabaseAdminClient.rpc("get_active_service_providers", {
    p_category: params.category ?? null,
    p_lat: params.latitude ?? null,
    p_lng: params.longitude ?? null,
    p_query: params.query ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (error || !data) return { items: [], totalCount: 0 };

  const rows = data as RawActiveServiceProviderRow[];

  return {
    items: rows.map((row) => ({
      id: row.id,
      serviceCategoryId: row.service_category_id,
      categoryNameFa: row.category_name_fa,
      categoryNamePs: row.category_name_ps,
      categoryIconSource: row.category_icon_source === "custom" ? "custom" : "builtin",
      categoryIconKey: row.category_icon_key,
      categoryIconUrl: row.category_icon_url,
      contactPhone: row.contact_phone,
      address: row.address,
      description: row.description,
      images: row.images ?? [],
      latitude: row.latitude,
      longitude: row.longitude,
      distanceMeters: row.distance_meters,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}