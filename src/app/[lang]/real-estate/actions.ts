// مسیر فایل: src/app/[lang]/real-estate/actions.ts
// تسک ۶ فاز ۰۵ — Server Action جستجو/مرتب‌سازی فهرست آگهی‌های ملک، دقیقاً هم‌الگو با
// src/app/[lang]/listings/actions.ts (فاز ۰۲، تسک ۷). روی همان الگوی امنیتی بقیه‌ی پروژه است:
// هیچ ورودی خام کاربر مستقیم به کوئری دیتابیس نمی‌رود؛ نوع ملک با isValidPropertyType و نوع
// معامله با isValidDealType اعتبارسنجی می‌شوند، طول عبارت جستجو محدود می‌شود، و مختصات مکانی فقط
// اگر عدد معتبر باشند فرستاده می‌شوند (در غیر این صورت null، یعنی «بدون مرتب‌سازی مکانی» — دقیقاً
// رفتار پیش‌فرض هنگام رد دسترسی GPS).
"use server";

import { searchRealEstate, type RealEstateSummary } from "@/lib/realEstate/queries";
import { isValidPropertyType } from "@/lib/realEstate/propertyTypes";
import { isValidDealType } from "@/lib/realEstate/dealTypes";
import { isValidProvince } from "@/lib/provinces";

import { REAL_ESTATE_PAGE_SIZE } from "./constants";
const MAX_QUERY_LENGTH = 80;

export async function searchRealEstateAction(input: {
  propertyType?: string | null;
  dealType?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  offset?: number;
}): Promise<{ items: RealEstateSummary[]; totalCount: number }> {
  const propertyType =
    input.propertyType && isValidPropertyType(input.propertyType) ? input.propertyType : null;

  const dealType = input.dealType && isValidDealType(input.dealType) ? input.dealType : null;

  // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» (هم اگر صراحتاً انتخاب شده، هم اگر نامعتبر باشد).
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

  return searchRealEstate({
    propertyType,
    dealType,
    province,
    latitude,
    longitude,
    query,
    limit: REAL_ESTATE_PAGE_SIZE,
    offset,
  });
}