// مسیر فایل: src/app/[lang]/services/actions.ts
// تسک ۷ فاز ۰۴ — Server Action جستجو/فیلتر متخصصین فعال. دقیقاً هم‌الگو با
// src/app/[lang]/listings/actions.ts (فاز ۰۲، تسک ۷) و
// src/app/[lang]/transport/actions.ts (فاز ۰۳، تسک ۸): هیچ ورودی خام کاربر مستقیم به کوئری
// دیتابیس نمی‌رود؛ مختصات فقط اگر عدد معتبر باشند فرستاده می‌شوند.
"use server";

import {
  getActiveServiceProviders,
  type ActiveServiceProviderSummary,
} from "@/lib/services/serviceProviderQueries";
import { isValidProvince } from "@/lib/provinces";
import { SERVICE_PROVIDERS_PAGE_SIZE } from "./constants";

export async function searchActiveServiceProvidersAction(input: {
  category?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: ActiveServiceProviderSummary[]; totalCount: number }> {
  const category = typeof input.category === "string" && input.category.length > 0 ? input.category : null;

  // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» (هم اگر صراحتاً انتخاب شده، هم اگر نامعتبر باشد).
  const province = input.province && isValidProvince(input.province) ? input.province : null;

  const latitude =
    typeof input.latitude === "number" && Number.isFinite(input.latitude) ? input.latitude : null;
  const longitude =
    typeof input.longitude === "number" && Number.isFinite(input.longitude)
      ? input.longitude
      : null;

  const query = typeof input.query === "string" && input.query.trim().length > 0 ? input.query.trim() : null;

  const offset =
    Number.isInteger(input.offset) && (input.offset as number) > 0 ? (input.offset as number) : 0;

  const limit =
    Number.isInteger(input.limit) && (input.limit as number) > 0
      ? (input.limit as number)
      : SERVICE_PROVIDERS_PAGE_SIZE;

  return getActiveServiceProviders({ category, province, latitude, longitude, query, limit, offset });
}