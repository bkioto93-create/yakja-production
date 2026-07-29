// مسیر فایل: src/lib/province/actions.ts
// فاز ۱۰ — ثبت کوکی «ولایت انتخابی کاربر». برخلاف setLanguage (که بعد از ثبت کوکی، کاربر را
// redirect می‌کند چون زبان بخشی از مسیر URL است)، اینجا نیازی به redirect نیست: ولایت هیچ اثری
// روی ساختار URL ندارد، فقط روی داده‌ی خوانده‌شده در همان صفحه؛ کامپوننت کلاینت (ProvinceBar) بعد
// از موفقیت این اکشن، خودش router.refresh() را صدا می‌زند تا Server Component های صفحه‌ی جاری
// (که کوکی را می‌خوانند) با مقدار تازه دوباره رندر شوند — بدون تغییر آدرس صفحه.
"use server";

import { cookies } from "next/headers";
import { PROVINCE_COOKIE_NAME, PROVINCE_COOKIE_MAX_AGE, ALL_PROVINCES_VALUE } from "./constants";
import { isValidProvince } from "@/lib/provinces";

export async function setProvinceAction(
  value: string
): Promise<{ success: true } | { success: false; error: string }> {
  // محافظت در برابر مقدار نامعتبر احتمالی (دفاع در عمق — کلاینت هم فقط مقادیر مجاز را می‌فرستد).
  if (value !== ALL_PROVINCES_VALUE && !isValidProvince(value)) {
    return { success: false, error: "invalidProvince" };
  }

  const cookieStore = await cookies();
  cookieStore.set(PROVINCE_COOKIE_NAME, value, {
    path: "/",
    maxAge: PROVINCE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  return { success: true };
}