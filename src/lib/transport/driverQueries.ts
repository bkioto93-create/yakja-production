// مسیر فایل: src/lib/transport/driverQueries.ts
// تسک ۴ فاز ۰۳ — لایه‌ی خواندن پروفایل راننده‌ی خودِ کاربر، دقیقاً هم‌الگو با
// src/lib/marketplace/queries.ts (فاز ۰۲، تسک ۶). برخلاف queries.ts آنجا، اینجا نیازی به تابع
// Postgres/RPC نیست چون ستون geography (location) در این مرحله (تسک ۴) نه خوانده و نه نمایش داده
// می‌شود — فقط ستون‌های ساده‌ی پروفایل (نوع وسیله، مشخصات، شماره تماس، وضعیت فعال/غیرفعال) لازم
// است؛ یک select ساده روی جدول drivers کافی است.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** ستون drivers.images
// (20_phase_08b_transport_services_photos.sql) به هر دو تابع این فایل اضافه شد — هم به
// getMyDriverProfile (برای نمایش عکس‌های موجود در حالت ویرایش پروفایل) و هم به تابع Postgres
// get_active_drivers که getActiveDrivers از آن استفاده می‌کند (برای فهرست عمومی).
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** getMyDriverProfile فیلد تازه‌ی videoPath گرفت (برای نمایش
// ویدئوی موجود در حالت ویرایش)؛ ActiveDriverSummary فیلدهای videoPath و ownerIsVip گرفت (برای
// VipBadge و پخش‌کننده‌ی ویدئو در کارت راننده، طبق بند ۵ پرامپت VIP).
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { VehicleTypeId } from "./vehicleTypes";

export type MyDriverProfile = {
  id: string;
  vehicleType: VehicleTypeId;
  vehicleDetails: string | null;
  contactPhone: string;
  province: string | null;
  isActive: boolean;
  images: string[];
  videoPath: string | null;
};

// پروفایل راننده‌ی خودِ کاربرِ واردشده را برمی‌گرداند؛ اگر هنوز پروفایلی نساخته (کاربر تازه به
// این صفحه آمده)، null برمی‌گردد — یعنی فرم باید در «حالت ثبت» (نه ویرایش) نمایش داده شود.
export async function getMyDriverProfile(ownerId: string): Promise<MyDriverProfile | null> {
  const { data, error } = await supabaseAdminClient
    .from("drivers")
    .select("id, vehicle_type, vehicle_details, contact_phone, province, is_active, images, video_path")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    vehicleType: data.vehicle_type as VehicleTypeId,
    vehicleDetails: data.vehicle_details,
    contactPhone: data.contact_phone,
    province: data.province ?? null,
    isActive: data.is_active,
    images: data.images ?? [],
    videoPath: data.video_path ?? null,
  };
}

// تسک ۸ فاز ۰۳ — فهرست رانندگان «فعال» برای کاربر متقاضی، با مرتب‌سازی بر اساس نزدیک‌ترین فاصله
// (PostGIS) در صورت داشتن مختصات کاربر، وگرنه بر اساس آخرین به‌روزرسانی موقعیت. هم‌الگو با
// searchListings (فاز ۰۲، تسک ۷): از تابع Postgres get_active_drivers از طریق rpc(...) استفاده
// می‌شود، نه select مستقیم، چون بازگرداندن ستون geography مستقیماً شکننده است.
//
// contact_phone عمداً از همین تسک در نوع/کوئری برگردانده می‌شود، هرچند هنوز در رابط کاربری
// (ActiveDriversList.tsx) نمایش داده نمی‌شود — طبق متن دقیق تسک ۹ («افزودن دکمه‌ی تماس») که این
// کار را جدا مشخص کرده؛ این کار باعث می‌شود تسک ۹ فقط یک تغییر رابط کاربری ساده باشد، بدون نیاز
// به تغییر SQL یا این لایه‌ی خواندن.
export type ActiveDriverSummary = {
  id: string;
  ownerId: string;
  vehicleType: VehicleTypeId;
  vehicleDetails: string | null;
  contactPhone: string;
  images: string[];
  videoPath: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  lastLocationUpdate: string | null;
  ownerIsVip: boolean;
};

// شکل خام ردیفی که تابع Postgres «get_active_drivers» برمی‌گرداند.
type RawActiveDriverRow = {
  id: string;
  owner_id: string;
  vehicle_type: string;
  vehicle_details: string | null;
  contact_phone: string;
  images: string[] | null;
  video_path: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  last_location_update: string | null;
  owner_is_vip: boolean;
  total_count: number;
};

export async function getActiveDrivers(params: {
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: ActiveDriverSummary[]; totalCount: number }> {
  const { data, error } = await supabaseAdminClient.rpc("get_active_drivers", {
    // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی.
    p_province: params.province ?? null,
    p_lat: params.latitude ?? null,
    p_lng: params.longitude ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (error || !data) return { items: [], totalCount: 0 };

  const rows = data as RawActiveDriverRow[];

  return {
    items: rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      vehicleType: row.vehicle_type as VehicleTypeId,
      vehicleDetails: row.vehicle_details,
      contactPhone: row.contact_phone,
      images: row.images ?? [],
      videoPath: row.video_path,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceMeters: row.distance_meters,
      lastLocationUpdate: row.last_location_update,
      ownerIsVip: row.owner_is_vip ?? false,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}