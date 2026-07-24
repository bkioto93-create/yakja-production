// مسیر فایل: src/app/select-language/actions.ts
// تسک ۲ فاز ۰۱ — ثبت انتخاب زبان کاربر در یک کوکی بلندمدت، سپس هدایت به مسیر همان زبان.
// از این پس src/proxy.ts این کوکی را می‌خواند تا کاربر دیگر مجبور به انتخاب مجدد زبان نشود.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LANG_COOKIE_NAME, LANG_COOKIE_MAX_AGE, isValidLocale, type Locale } from "@/lib/i18n/constants";

export async function setLanguage(lang: Locale) {
  if (!isValidLocale(lang)) {
    // محافظت در برابر مقدار نامعتبر احتمالی (دفاع در عمق — کلاینت هم فقط دو مقدار مجاز را می‌فرستد).
    // **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** طبق الگوی مصوب نسخه‌ی ۲.۳ سند راهبردی (بند ۴)، حتی این
    // خطای داخلی/دفاعی (که در عمل هرگز به کاربر نمایش داده نمی‌شود) باید یک کد کوتاه انگلیسی
    // باشد، نه جمله‌ی نهایی دری.
    throw new Error("invalidLocale");
  }

  const cookieStore = await cookies();
  cookieStore.set(LANG_COOKIE_NAME, lang, {
    path: "/",
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  redirect(`/${lang}`);
}


