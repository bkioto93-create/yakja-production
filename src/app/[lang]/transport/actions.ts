// مسیر فایل: src/app/[lang]/transport/actions.ts
// تسک ۸ فاز ۰۳ — Server Action فهرست/مرتب‌سازی رانندگان فعال. هم‌الگو با
// src/app/[lang]/listings/actions.ts (فاز ۰۲، تسک ۷): هیچ ورودی خام کاربر مستقیم به کوئری
// دیتابیس نمی‌رود؛ مختصات فقط اگر عدد معتبر باشند فرستاده می‌شوند.
//
// **رفع خطای Build:** ثابت DRIVERS_PAGE_SIZE قبلاً همین‌جا export می‌شد، اما فایل‌های
// "use server" فقط اجازه‌ی export کردن async function دارند. این ثابت به
// ./constants.ts منتقل شد؛ اینجا فقط برای استفاده‌ی داخلی import می‌شود.
"use server";

import { getActiveDrivers, type ActiveDriverSummary } from "@/lib/transport/driverQueries";
import { isValidProvince } from "@/lib/provinces";
import { DRIVERS_PAGE_SIZE } from "./constants";

export async function searchActiveDriversAction(input: {
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: ActiveDriverSummary[]; totalCount: number }> {
  // فاز ۱۰: province=null یعنی «همه‌ی افغانستان» (هم اگر صراحتاً انتخاب شده، هم اگر نامعتبر باشد).
  const province = input.province && isValidProvince(input.province) ? input.province : null;

  const latitude =
    typeof input.latitude === "number" && Number.isFinite(input.latitude) ? input.latitude : null;
  const longitude =
    typeof input.longitude === "number" && Number.isFinite(input.longitude)
      ? input.longitude
      : null;

  const offset =
    Number.isInteger(input.offset) && (input.offset as number) > 0 ? (input.offset as number) : 0;

  const limit =
    Number.isInteger(input.limit) && (input.limit as number) > 0
      ? (input.limit as number)
      : DRIVERS_PAGE_SIZE;

  return getActiveDrivers({ province, latitude, longitude, limit, offset });
}