// مسیر فایل: src/lib/transport/adminDriverQueries.ts
// تسک ۵ فاز ۰۷ — لایه‌ی خواندنِ «مدیریت اختصاصی رانندگان» در پنل ادمین. دقیقاً هم‌الگو با
// src/lib/users/adminUserQueries.ts (تسک ۲): صفحه‌بندی واقعی (limit/offset) + جستجوی اختیاری،
// به‌علاوه‌ی یک join درون‌حافظه‌ای با جدول users برای نام/شماره‌ی مالکِ هر پروفایل راننده —
// دقیقاً هم‌الگو با src/lib/marketplace/adminListingQueries.ts (تسک ۳). برخلاف driverQueries.ts
// (که فقط پروفایل خودِ کاربر یا فهرست عمومیِ «فعال» را می‌خواند)، این فایل تمام رانندگان را با
// هر وضعیتی برمی‌گرداند چون مخاطبش ادمین است، نه کاربر نهایی یا خودِ راننده.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { VehicleTypeId } from "./vehicleTypes";

export type AdminDriverRow = {
  id: string;
  ownerId: string;
  vehicleType: VehicleTypeId;
  vehicleDetails: string | null;
  contactPhone: string;
  isActive: boolean;
  lastLocationUpdate: string | null;
  createdAt: string;
  ownerName: string | null;
  ownerPhone: string | null;
};

export const ADMIN_DRIVERS_PAGE_SIZE = 20;

// کاراکترهایی که در نحوی فیلتر `.or(...)` کتابخانه‌ی supabase-js معنای خاص دارند از عبارت
// جستجو حذف می‌شوند — دقیقاً هم‌الگو با sanitizeSearchTerm در adminUserQueries.ts.
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[%,]/g, "").trim();
}

export async function getDriversPage(params: {
  search?: string;
  page?: number;
}): Promise<{ items: AdminDriverRow[]; totalCount: number; pageSize: number }> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const from = (page - 1) * ADMIN_DRIVERS_PAGE_SIZE;
  const to = from + ADMIN_DRIVERS_PAGE_SIZE - 1;

  let query = supabaseAdminClient
    .from("drivers")
    .select(
      "id, owner_id, vehicle_type, vehicle_details, contact_phone, is_active, last_location_update, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = params.search ? sanitizeSearchTerm(params.search) : "";
  if (search) {
    // چون contact_phone ستون خودِ جدول drivers است، جستجو مستقیماً روی همین جدول انجام می‌شود؛
    // جستجو بر اساس نام مالک (که در جدول users است) در همین کوئری ممکن نیست — دقیقاً همان
    // محدودیت شناخته‌شده‌ای که adminListingQueries.ts هم دارد (رجوع کنید به یادداشت آنجا).
    query = query.ilike("contact_phone", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { items: [], totalCount: 0, pageSize: ADMIN_DRIVERS_PAGE_SIZE };
  }

  const ownerIds = Array.from(new Set(data.map((row) => row.owner_id as string)));
  const { data: owners } = ownerIds.length
    ? await supabaseAdminClient.from("users").select("id, name, phone_number").in("id", ownerIds)
    : { data: [] as { id: string; name: string | null; phone_number: string }[] };

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  return {
    items: data.map((row) => {
      const owner = ownerById.get(row.owner_id as string);
      return {
        id: row.id as string,
        ownerId: row.owner_id as string,
        vehicleType: row.vehicle_type as VehicleTypeId,
        vehicleDetails: row.vehicle_details as string | null,
        contactPhone: row.contact_phone as string,
        isActive: row.is_active as boolean,
        lastLocationUpdate: row.last_location_update as string | null,
        createdAt: row.created_at as string,
        ownerName: owner?.name ?? null,
        ownerPhone: owner?.phone_number ?? null,
      };
    }),
    totalCount: count ?? 0,
    pageSize: ADMIN_DRIVERS_PAGE_SIZE,
  };
}