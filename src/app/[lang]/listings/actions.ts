// مسیر فایل: src/app/[lang]/listings/actions.ts
// تسک ۷ فاز ۰۲ — Server Action جستجو/مرتب‌سازی فهرست آگهی‌ها.
// روی همان الگوی امنیتی بقیه‌ی پروژه است: هیچ ورودی خام کاربر مستقیم به کوئری دیتابیس نمی‌رود؛
// دسته‌بندی با isValidListingCategory اعتبارسنجی می‌شود، طول عبارت جستجو محدود می‌شود، و مختصات
// مکانی فقط اگر عدد معتبر باشند فرستاده می‌شوند (در غیر این صورت null، یعنی «بدون مرتب‌سازی
// مکانی» — دقیقاً رفتار پیش‌فرض هنگام رد دسترسی GPS).
"use server";

import { searchListings, type ListingSummary } from "@/lib/marketplace/queries";
import { isValidListingCategory } from "@/lib/marketplace/categories";
import { isValidProvince } from "@/lib/provinces";
import { LISTINGS_PAGE_SIZE } from "./constants";

const MAX_QUERY_LENGTH = 80;

export async function searchListingsAction(input: {
  category?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  offset?: number;
}): Promise<{ items: ListingSummary[]; totalCount: number }> {
  const category =
    input.category && isValidListingCategory(input.category) ? input.category : null;

  // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» (هم اگر کاربر صراحتاً آن را انتخاب کرده باشد، هم
  // اگر مقدار ورودی نامعتبر باشد) — دقیقاً هم‌الگو با اعتبارسنجی category بالا.
  const province = input.province && isValidProvince(input.province) ? input.province : null;

  const trimmedQuery = input.query?.trim() ?? "";
  const query = trimmedQuery ? trimmedQuery.slice(0, MAX_QUERY_LENGTH) : null;

  const latitude =
    typeof input.latitude === "number" && Number.isFinite(input.latitude) ? input.latitude : null;
  const longitude =
    typeof input.longitude === "number" && Number.isFinite(input.longitude)
      ? input.longitude
      : null;

  const offset =
    Number.isInteger(input.offset) && (input.offset as number) > 0 ? (input.offset as number) : 0;

  return searchListings({
    category,
    province,
    latitude,
    longitude,
    query,
    limit: LISTINGS_PAGE_SIZE,
    offset,
  });
}