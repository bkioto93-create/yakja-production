// مسیر فایل: src/proxy.ts
// **تغییر مهم (بخشی از تسک ۲ فاز ۰۱)**: قبلاً هر مسیر بدون پیشوند زبان، بی‌قیدوشرط به /fa
// هدایت می‌شد. حالا اگر کوکی زبان (yakja_lang) ذخیره شده باشد، به همان زبان هدایت می‌شویم؛
// اگر نبود، اول به /select-language می‌رویم تا کاربر یک‌بار زبانش را انتخاب کند.
//
// **به‌روزرسانی تسک ۱۱ فاز ۰۷ (تصمیم‌گیری درباره‌ی دوزبانه‌بودن پنل مدیریت):** طبق تصمیم صریح
// کارفرما، خودِ پنل مدیریت (برخلاف سایت عمومی) قرار نیست دوزبانه باشد؛ فقط دری کافی است. کد
// پنل از قبل از دیکشنری عمومی (fa.ts/ps.ts) می‌خواند، پس از نظر فنی هنوز «قابلیت» دوزبانگی را
// دارد؛ برای اینکه در عمل هرگز به پشتو دیده نشود — چه با تایپ مستقیم /ps/admin در آدرس، چه با
// ورود بدون پیشوند زبان درحالی‌که کوکی yakja_lang روی «ps» تنظیم است (مثلاً چون خودِ ادمین قبلاً
// در پروفایل زبان سایت را عوض کرده) — همین یک نقطه (proxy) هر درخواست ادمین را، صرف‌نظر از
// زبان درخواستی، به معادل دری‌اش هدایت می‌کند. این ساده‌ترین و کم‌ریسک‌ترین راه است: هیچ فایل
// دیگری در پنل (layout.tsx، صفحات، دیکشنری‌ها) دست‌نخورده باقی می‌ماند.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, LANG_COOKIE_NAME, isValidLocale } from "@/lib/i18n/constants";

// زبان قفل‌شده‌ی پنل مدیریت — طبق تسک ۱۱ فاز ۰۷. اگر کارفرما در آینده نظرش عوض شد،
// فقط همین یک مقدار باید تغییر کند.
const ADMIN_LOCKED_LANG = "fa";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // اگر مسیر یکی از فایل‌های اصلی، API یا خودِ صفحه‌ی انتخاب زبان بود، کاری نداشته باش
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/select-language") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // بررسی اینکه آیا URL شامل زبان هست یا نه
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // تسک ۱۱ فاز ۰۷: هر مسیر ادمین با زبانی غیر از زبان قفل‌شده‌ی پنل (دری)، به معادل دری‌اش
    // هدایت می‌شود؛ مثلاً /ps/admin/users → /fa/admin/users. بقیه‌ی سایت (غیر از /admin) دست‌نخورده
    // و کاملاً دوزبانه باقی می‌ماند.
    for (const locale of LOCALES) {
      if (locale === ADMIN_LOCKED_LANG) continue;
      const prefix = `/${locale}/admin`;
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        request.nextUrl.pathname = pathname.replace(`/${locale}/admin`, `/${ADMIN_LOCKED_LANG}/admin`);
        return NextResponse.redirect(request.nextUrl);
      }
    }
    return NextResponse.next();
  }

  // اگر کاربر قبلاً زبانش را انتخاب کرده (کوکی موجود است)، مستقیم به همان مسیر زبانی برو
  const savedLang = request.cookies.get(LANG_COOKIE_NAME)?.value;
  if (isValidLocale(savedLang)) {
    // تسک ۱۱ فاز ۰۷: اگر مسیر درخواستی به پنل ادمین اشاره دارد (مثلاً کاربر مستقیم "/admin" یا
    // "/admin/users" را بدون پیشوند زبان باز کرده)، صرف‌نظر از زبان ذخیره‌شده در کوکی، همیشه با
    // زبان قفل‌شده‌ی پنل (دری) هدایت می‌شود.
    const effectiveLang =
      pathname === "/admin" || pathname.startsWith("/admin/") ? ADMIN_LOCKED_LANG : savedLang;
    request.nextUrl.pathname = `/${effectiveLang}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // در غیر این صورت، اول باید زبان را انتخاب کند
  request.nextUrl.pathname = "/select-language";
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next).*)"],
};