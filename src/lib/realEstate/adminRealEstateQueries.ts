// مسیر فایل: src/lib/realEstate/adminRealEstateQueries.ts
// تسک ۳ فاز ۰۷ — لایه‌ی خواندنِ «تایید/حذف آگهی‌های ملک» در پنل ادمین. دقیقاً هم‌الگو با
// src/lib/marketplace/adminListingQueries.ts (همین تسک): ستون status جدول real_estate از قبل،
// طبق تسک ۲/۷ فاز ۰۵، با CHECK روی سه مقدار pending/approved/deleted تعریف شده — هیچ ستون یا
// دستور دیتابیسی جدیدی برای این تسک لازم نبود.
//
// تفاوت با ماژول کالا: جدول real_estate ستون title یا contact_phone ندارد (تسک ۴ فاز ۰۵)، پس در
// این فهرست عنوان کوتاهی وجود ندارد (به‌جایش در سمت کامپوننت از آدرس استفاده می‌شود) و شماره
// تماس هم فقط از طریق owner (join در حافظه به users، دقیقاً هم‌الگو با ownerName/ownerPhone در
// adminListingQueries.ts) در دسترس است.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type RealEstateModerationStatus = "pending" | "approved" | "deleted";

export type AdminRealEstateRow = {
  id: string;
  propertyType: string;
  dealType: string;
  price: number;
  address: string;
  images: string[];
  status: RealEstateModerationStatus;
  createdAt: string;
  ownerName: string | null;
  ownerPhone: string | null;
};

export const ADMIN_REAL_ESTATE_PAGE_SIZE = 20;

type RawAdminRealEstateRow = {
  id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  images: string[];
  status: RealEstateModerationStatus;
  created_at: string;
  owner_id: string;
};

// صفِ آگهی‌های ملک برای یک وضعیت مشخص (تب فعال در پنل مدیریت)، جدیدترین‌ها اول، صفحه‌بندی‌شده.
export async function getRealEstateQueue(params: {
  status: RealEstateModerationStatus;
  page?: number;
}): Promise<{ items: AdminRealEstateRow[]; totalCount: number; pageSize: number }> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const from = (page - 1) * ADMIN_REAL_ESTATE_PAGE_SIZE;
  const to = from + ADMIN_REAL_ESTATE_PAGE_SIZE - 1;

  const { data, error, count } = await supabaseAdminClient
    .from("real_estate")
    .select(
      "id, property_type, deal_type, price, address, images, status, created_at, owner_id",
      { count: "exact" }
    )
    .eq("status", params.status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { items: [], totalCount: 0, pageSize: ADMIN_REAL_ESTATE_PAGE_SIZE };
  }

  const rows = data as RawAdminRealEstateRow[];
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
        propertyType: row.property_type,
        dealType: row.deal_type,
        price: Number(row.price),
        address: row.address,
        images: row.images ?? [],
        status: row.status,
        createdAt: row.created_at,
        ownerName: owner?.name ?? null,
        ownerPhone: owner?.phone_number ?? null,
      };
    }),
    totalCount: count ?? 0,
    pageSize: ADMIN_REAL_ESTATE_PAGE_SIZE,
  };
}

// شمارش سبک (بدون خواندن ردیف‌ها) آگهی‌های ملکِ «در انتظار تایید» — برای نشان (Badge) کارت
// داشبورد ادمین، دقیقاً هم‌الگو با getPendingListingsCount.
export async function getPendingRealEstateCount(): Promise<number> {
  const { count } = await supabaseAdminClient
    .from("real_estate")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return count ?? 0;
}