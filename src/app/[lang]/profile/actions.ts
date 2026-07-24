// مسیر فایل: src/app/[lang]/profile/actions.ts
// تسک ۸ فاز ۰۱ — اکشن‌های صفحه‌ی «تنظیمات پروفایل»: سوییچ زبان و خروج از حساب.
//
// **به‌روزرسانی تسک ۴ فاز M01 (لایه‌ی API موبایل):** بخشِ «ثبت زبان انتخابی کاربر در ستون
// users.language» که قبلاً به‌صورت درون‌خطی داخل switchLanguageAction نوشته شده بود، به یک تابع
// جدا (`updateUserLanguage`) استخراج شد — چون همین منطق باید بدون هیچ تغییری از PATCH
// `src/app/api/mobile/v1/profile/route.ts` هم صدا زده شود، بدون این‌که مسیر موبایل مجبور شود
// عوارض جانبی مخصوص مرورگر (`cookies().set(...)`, `redirect(...)`) را هم اجرا کند — این دو مورد
// فقط برای وب معنا دارند؛ اپ موبایل نه کوکی مرورگر دارد و نه ناوبری Next.js را می‌شناسد.
// `switchLanguageAction` وب پس از این تغییر حرف‌به‌حرف همان رفتار قبلی را دارد (فقط همان یک خط
// به‌روزرسانی دیتابیس، عیناً و بدون تغییر منطق، به تابع تازه منتقل شد)؛ صفر تغییر رفتاری برای وب.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import {
  LANG_COOKIE_NAME,
  LANG_COOKIE_MAX_AGE,
  isValidLocale,
  type Locale,
} from "@/lib/i18n/constants";

// منطق مشترکِ «ثبت زبان انتخابی کاربر در ستون users.language» — بدون هیچ عارضه‌ی جانبی مخصوص
// مرورگر (کوکی/ریدایرکت)، تا هم از switchLanguageAction (وب، پایین همین فایل) و هم از PATCH
// /api/mobile/v1/profile (موبایل، تسک ۴ فاز M01) با رفتار کاملاً یکسان و بدون دوباره‌کاری صدا
// زده شود. عیناً همان یک خطِ به‌روزرسانی‌ای است که پیش از این تسک داخل switchLanguageAction بود.
export async function updateUserLanguage(userId: string, lang: Locale): Promise<void> {
  await supabaseAdminClient.from("users").update({ language: lang }).eq("id", userId);
}

// سوییچ زبان از داخل تنظیمات پروفایل (برخلاف src/app/select-language/actions.ts که کاربر را
// به صفحه‌ی خانه هدایت می‌کند، اینجا کاربر روی همین صفحه‌ی پروفایل باقی می‌ماند — طبق بند ۳ سند
// راهبردی: «سوییچ زبان میان‌جلسه» باید بدون خروج از تنظیمات پروفایل ممکن باشد).
export async function switchLanguageAction(lang: Locale) {
  if (!isValidLocale(lang)) {
    // محافظت در برابر مقدار نامعتبر احتمالی (دفاع در عمق — کلاینت هم فقط دو مقدار مجاز را می‌فرستد).
    // **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** این خطا در عمل هرگز به کاربر نمایش داده نمی‌شود (نه
    // مسیر معمول کلاینت آن را ایجاد می‌کند، نه هیچ کامپوننتی پیام آن را می‌خواند)، اما طبق الگوی
    // مصوب نسخه‌ی ۲.۳ سند راهبردی (بند ۴)، حتی چنین خطای داخلی/دفاعی‌ای باید یک کد کوتاه انگلیسی
    // باشد، نه جمله‌ی نهایی دری.
    throw new Error("invalidLocale");
  }

  const cookieStore = await cookies();
  cookieStore.set(LANG_COOKIE_NAME, lang, {
    path: "/",
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  // اگر کاربر وارد شده باشد، ستون «زبان انتخابی» او در جدول users نیز هماهنگ می‌شود (بند ۷ سند
  // راهبردی)، بدون هیچ تغییری در نقش (role) یا سایر داده‌های حساب.
  const user = await getCurrentUser();
  if (user) {
    await updateUserLanguage(user.id, lang);
  }

  redirect(`/${lang}/profile`);
}

export async function logoutAction(lang: string) {
  await destroySession();
  redirect(`/${lang}`);
}