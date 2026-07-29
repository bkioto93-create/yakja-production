// مسیر فایل: src/lib/province/getSelectedProvince.ts
// فاز ۱۰ — تابع کمکی مشترک سمت سرور: کوکی yakja_province را می‌خواند و به یک مقدار امن و
// تایپ‌شده تبدیل می‌کند. هر Server Component که نیاز به فیلتر ولایتی دارد (page.tsx هر ۴ ماژول +
// صفحه‌ی اصلی + layout.tsx برای ProvinceBar)، دقیقاً همین یک تابع را صدا می‌زند — تا منطق تفسیر
// کوکی (مقدار خالی/نامعتبر/«all»/شناسه‌ی معتبر) فقط در یک‌جا نوشته شده باشد.
//
// province: null یعنی «بدون فیلتر ولایتی» — چه به این خاطر که کاربر صراحتاً «همه‌ی افغانستان» را
// انتخاب کرده (hasChosen=true)، چه به این خاطر که هنوز اصلاً چیزی انتخاب نکرده (hasChosen=false).
// این تفکیک لازم است چون ProvinceBar فقط در حالت دوم باید مودال انتخاب را خودکار باز کند.
import "server-only";
import { cookies } from "next/headers";
import { PROVINCE_COOKIE_NAME, ALL_PROVINCES_VALUE } from "./constants";
import { isValidProvince, type ProvinceId } from "@/lib/provinces";

export type SelectedProvinceResult = {
  province: ProvinceId | null;
  hasChosen: boolean;
};

export async function getSelectedProvince(): Promise<SelectedProvinceResult> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PROVINCE_COOKIE_NAME)?.value;

  if (!raw) {
    return { province: null, hasChosen: false };
  }
  if (raw === ALL_PROVINCES_VALUE) {
    return { province: null, hasChosen: true };
  }
  if (isValidProvince(raw)) {
    return { province: raw, hasChosen: true };
  }
  // مقدار خراب/نامعتبر کوکی (مثلاً دستکاری دستی) — دفاع در عمق: مثل «هنوز انتخاب نشده» رفتار
  // می‌شود تا کاربر دوباره از مودال انتخاب کند.
  return { province: null, hasChosen: false };
}