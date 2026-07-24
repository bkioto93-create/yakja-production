// مسیر فایل: src/lib/marketplace/adminListingQueries.ts
// تسک ۳ فاز ۰۷ — لایه‌ی خواندنِ «تایید/حذف آگهی‌های کالا» در پنل ادمین.
// دقیقاً هم‌الگو با src/lib/users/adminUserQueries.ts (تسک ۲ همین فاز، صفحه‌بندی واقعی
// limit/offset) و src/lib/reports/adminReportQueries.ts (تسک ۴/۵، تفکیک بر اساس وضعیت): این
// فایل صف آگهی‌های کالا را بر اساس ستون status (که از قبل، طبق تسک ۲/۹ فاز ۰۲، در دیتابیس با
// CHECK روی سه مقدار pending/approved/deleted تعریف شده) صفحه‌بندی‌شده برمی‌گرداند — هیچ ستون یا
// دستور دیتابیسی جدیدی برای این تسک لازم نبود.
//
// اطلاعات مالک (نام/شماره) هم‌الگو با adminReportQueries.ts، با یک کوئری batched دوم
// (`.in("id", ownerIds)`) از جدول users خوانده و در حافظه با ردیف‌های listings ترکیب می‌شود؛
// چون هیچ Foreign Key واقعی/Join مستقیمی بین این دو جدول برای supabase-js تعریف نشده.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type ListingModerationStatus = "pending" | "approved" | "deleted";

export type AdminListingRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  contactPhone: string;
  images: string[];
  status: ListingModerationStatus;
  createdAt: string;
  ownerName: string | null;
  ownerPhone: string | null;
};

export const ADMIN_LISTINGS_PAGE_SIZE = 20;

type RawAdminListingRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  contact_phone: string;
  images: string[];
  status: ListingModerationStatus;
  created_at: string;
  owner_id: string;
};

// صفِ آگهی‌های کالا برای یک وضعیت مشخص (تب فعال در پنل مدیریت)، جدیدترین‌ها اول، صفحه‌بندی‌شده.
export async function getListingsQueue(params: {
  status: ListingModerationStatus;
  page?: number;
}): Promise<{ items: AdminListingRow[]; totalCount: number; pageSize: number }> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const from = (page - 1) * ADMIN_LISTINGS_PAGE_SIZE;
  const to = from + ADMIN_LISTINGS_PAGE_SIZE - 1;

  const { data, error, count } = await supabaseAdminClient
    .from("listings")
    .select(
      "id, category, title, price, address, contact_phone, images, status, created_at, owner_id",
      { count: "exact" }
    )
    .eq("status", params.status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { items: [], totalCount: 0, pageSize: ADMIN_LISTINGS_PAGE_SIZE };
  }

  const rows = data as RawAdminListingRow[];
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));

  const { data: owners } = ownerIds.length
    ? await supabaseAdminClient.from("users").select("id, name, phone_number").in("id", ownerIds)
    : { data: [] as { id: string; name: string | null; phone_number: string }[] };

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  return {
    items: rows.map((row) => {
      const owner = ownerById.get(row.owner_id);
      return {
        id: row.id,
        category: row.category,
        title: row.title,
        price: Number(row.price),
        address: row.address,
        contactPhone: row.contact_phone,
        images: row.images ?? [],
        status: row.status,
        createdAt: row.created_at,
        ownerName: owner?.name ?? null,
        ownerPhone: owner?.phone_number ?? null,
      };
    }),
    totalCount: count ?? 0,
    pageSize: ADMIN_LISTINGS_PAGE_SIZE,
  };
}

// شمارش سبک (بدون خواندن ردیف‌ها) آگهی‌های کالای «در انتظار تایید» — برای نشان (Badge) کارت
// داشبورد ادمین، دقیقاً هم‌الگو با getPendingReportsCount در adminReportQueries.ts.
export async function getPendingListingsCount(): Promise<number> {
  const { count } = await supabaseAdminClient
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return count ?? 0;
}