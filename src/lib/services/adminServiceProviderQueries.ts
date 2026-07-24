// مسیر فایل: src/lib/services/adminServiceProviderQueries.ts
// تسک ۵ فاز ۰۷ — لایه‌ی خواندنِ «مدیریت اختصاصی متخصصین فنی» در پنل ادمین. دقیقاً هم‌الگو با
// src/lib/transport/adminDriverQueries.ts (همین تسک): صفحه‌بندی واقعی + جستجوی اختیاری، به‌علاوه‌ی
// دو join درون‌حافظه‌ای — یکی با جدول users (نام/شماره‌ی مالک)، یکی با service_categories
// (نام دری/پشتوی تخصص، چون service_category_id فقط یک uuid خام است).
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type AdminServiceProviderRow = {
  id: string;
  ownerId: string;
  serviceCategoryId: string;
  categoryNameFa: string | null;
  categoryNamePs: string | null;
  contactPhone: string;
  address: string;
  description: string | null;
  isActive: boolean;
  ownerName: string | null;
  ownerPhone: string | null;
};

export const ADMIN_SERVICE_PROVIDERS_PAGE_SIZE = 20;

function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[%,]/g, "").trim();
}

export async function getServiceProvidersPage(params: {
  search?: string;
  page?: number;
}): Promise<{ items: AdminServiceProviderRow[]; totalCount: number; pageSize: number }> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const from = (page - 1) * ADMIN_SERVICE_PROVIDERS_PAGE_SIZE;
  const to = from + ADMIN_SERVICE_PROVIDERS_PAGE_SIZE - 1;

  // این جدول برخلاف drivers/listings ستون created_at ندارد (تصمیم تسک ۴ فاز ۰۴)؛ مرتب‌سازی
  // پیش‌فرض روی id (جدیدترین ابتدا) انجام می‌شود — دقیقاً هم‌الگو با مرتب‌سازی ثانویه‌ی تابع
  // get_active_service_providers.
  let query = supabaseAdminClient
    .from("service_providers")
    .select(
      "id, owner_id, service_category_id, contact_phone, address, description, is_active",
      { count: "exact" }
    )
    .order("id", { ascending: false })
    .range(from, to);

  const search = params.search ? sanitizeSearchTerm(params.search) : "";
  if (search) {
    query = query.or(`address.ilike.%${search}%,contact_phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { items: [], totalCount: 0, pageSize: ADMIN_SERVICE_PROVIDERS_PAGE_SIZE };
  }

  const ownerIds = Array.from(new Set(data.map((row) => row.owner_id as string)));
  const categoryIds = Array.from(new Set(data.map((row) => row.service_category_id as string)));

  const [ownersResult, categoriesResult] = await Promise.all([
    ownerIds.length
      ? supabaseAdminClient.from("users").select("id, name, phone_number").in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null; phone_number: string }[] }),
    categoryIds.length
      ? supabaseAdminClient
          .from("service_categories")
          .select("id, name_fa, name_ps")
          .in("id", categoryIds)
      : Promise.resolve({ data: [] as { id: string; name_fa: string; name_ps: string }[] }),
  ]);

  const ownerById = new Map((ownersResult.data ?? []).map((o) => [o.id, o]));
  const categoryById = new Map((categoriesResult.data ?? []).map((c) => [c.id, c]));

  return {
    items: data.map((row) => {
      const owner = ownerById.get(row.owner_id as string);
      const category = categoryById.get(row.service_category_id as string);
      return {
        id: row.id as string,
        ownerId: row.owner_id as string,
        serviceCategoryId: row.service_category_id as string,
        categoryNameFa: category?.name_fa ?? null,
        categoryNamePs: category?.name_ps ?? null,
        contactPhone: row.contact_phone as string,
        address: row.address as string,
        description: row.description as string | null,
        isActive: row.is_active as boolean,
        ownerName: owner?.name ?? null,
        ownerPhone: owner?.phone_number ?? null,
      };
    }),
    totalCount: count ?? 0,
    pageSize: ADMIN_SERVICE_PROVIDERS_PAGE_SIZE,
  };
}