// مسیر فایل: src/lib/services/adminServiceProviderQueries.ts
// تسک ۵ فاز ۰۷ — لایه‌ی خواندنِ «مدیریت اختصاصی متخصصین فنی» در پنل ادمین. دقیقاً هم‌الگو با
// src/lib/transport/adminDriverQueries.ts: صفحه‌بندی واقعی (limit/offset) + جستجوی اختیاری روی
// contact_phone، به‌علاوه‌ی دو join درون‌حافظه‌ای — یکی با جدول users برای نام/شماره‌ی مالک هر
// پروفایل، و یکی با service_categories برای نام تخصص — دقیقاً هم‌الگو با
// src/lib/marketplace/adminListingQueries.ts (تسک ۳) از نظر batched query به‌جای join مستقیم.
// برخلاف serviceProviderQueries.ts (که فقط پروفایل خودِ کاربر یا فهرست عمومیِ «فعال» را
// می‌خواند)، این فایل تمام متخصصین را با هر وضعیتی برمی‌گرداند چون مخاطبش ادمین است.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type AdminServiceProviderRow = {
  id: string;
  ownerId: string;
  serviceCategoryId: string;
  categoryNameFa: string;
  categoryNamePs: string;
  contactPhone: string;
  address: string;
  province: string | null;
  description: string | null;
  isActive: boolean;
  images: string[];
  ownerName: string | null;
  ownerPhone: string | null;
};

export const ADMIN_SERVICE_PROVIDERS_PAGE_SIZE = 20;

// کاراکترهایی که در نحوی فیلتر `.or(...)` کتابخانه‌ی supabase-js معنای خاص دارند از عبارت
// جستجو حذف می‌شوند — دقیقاً هم‌الگو با sanitizeSearchTerm در adminDriverQueries.ts.
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

  // برخلاف drivers، جدول service_providers ستون created_at ندارد (رجوع کنید به
  // 15_phase_04_active_service_providers_function.sql)؛ مرتب‌سازی روی id انجام می‌شود.
  let query = supabaseAdminClient
    .from("service_providers")
    .select(
      "id, owner_id, service_category_id, contact_phone, address, province, description, is_active, images",
      { count: "exact" }
    )
    .order("id", { ascending: false })
    .range(from, to);

  const search = params.search ? sanitizeSearchTerm(params.search) : "";
  if (search) {
    // چون contact_phone ستون خودِ جدول service_providers است، جستجو مستقیماً روی همین جدول
    // انجام می‌شود — دقیقاً هم‌الگو با adminDriverQueries.ts.
    query = query.ilike("contact_phone", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { items: [], totalCount: 0, pageSize: ADMIN_SERVICE_PROVIDERS_PAGE_SIZE };
  }

  const ownerIds = Array.from(new Set(data.map((row) => row.owner_id as string)));
  const { data: owners } = ownerIds.length
    ? await supabaseAdminClient.from("users").select("id, name, phone_number").in("id", ownerIds)
    : { data: [] as { id: string; name: string | null; phone_number: string }[] };

  const categoryIds = Array.from(new Set(data.map((row) => row.service_category_id as string)));
  const { data: categories } = categoryIds.length
    ? await supabaseAdminClient
        .from("service_categories")
        .select("id, name_fa, name_ps")
        .in("id", categoryIds)
    : { data: [] as { id: string; name_fa: string; name_ps: string }[] };

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  return {
    items: data.map((row) => {
      const owner = ownerById.get(row.owner_id as string);
      const category = categoryById.get(row.service_category_id as string);
      return {
        id: row.id as string,
        ownerId: row.owner_id as string,
        serviceCategoryId: row.service_category_id as string,
        categoryNameFa: category?.name_fa ?? "",
        categoryNamePs: category?.name_ps ?? "",
        contactPhone: row.contact_phone as string,
        address: row.address as string,
        province: (row.province as string | null) ?? null,
        description: row.description as string | null,
        isActive: row.is_active as boolean,
        images: (row.images as string[] | null) ?? [],
        ownerName: owner?.name ?? null,
        ownerPhone: owner?.phone_number ?? null,
      };
    }),
    totalCount: count ?? 0,
    pageSize: ADMIN_SERVICE_PROVIDERS_PAGE_SIZE,
  };
}