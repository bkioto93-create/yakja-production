// مسیر فایل: src/app/api/mobile/v1/profile/route.ts
// تسک ۴ فاز M01 (لایه‌ی API موبایل، بخش الف) — نسخه‌ی HTTP-محورِ همان صفحه‌ی «تنظیمات پروفایل»ی
// که در وب با src/app/[lang]/profile/page.tsx (خواندن کاربر) و
// src/app/[lang]/profile/actions.ts::switchLanguageAction (تغییر زبان) انجام می‌شود.
//
// طبق همان اصل بنیادین تسک‌های ۲ و ۳ همین فاز (بند ۵ سند راهبردی موبایل): این Route Handler
// هیچ منطق تجاری تازه‌ای نمی‌نویسد.
//
// **🔴 رفع باگ واقعی (کشف‌شده در هم‌سازیِ فاز VIP موبایل):** فایل `context/AuthContext.tsx`ی
// پروژه‌ی موبایل، از همان فاز M01، صراحتاً یک یادداشتِ هشدار داشت: «شکل دقیق JSON این Route در
// این اسنپ‌شات موبایل در دسترس نبود؛ فرض شد `{ id, phoneNumber, name, role, language }`، لطفاً
// پیش از تست نهایی با کد واقعی این فایل مقایسه شود.» آن فرض هرگز تایید نشده بود — و غلط از آب
// درآمد: نسخه‌ی قبلیِ همین فایل اصلاً فیلد `id` را برنمی‌گرداند (فقط phoneNumber/name/role/
// language). نتیجه‌ی عملی: در کل اپ موبایل، `user?.id` همیشه `undefined` بود — از جمله در
// StoryViewer (تشخیصِ «آیا این استوری مالِ خودم است؟» برای نمایش دکمه‌ی حذف)، که همین امروز به
// همین دلیل برای هیچ‌کس کار نمی‌کرد. رفع شد: `id` اکنون در پاسخ GET وجود دارد.
//
// **افزوده‌شده (هم‌زمان، فاز VIP موبایل):** `vipExpiresAt` هم به همین پاسخ اضافه شد — دقیقاً
// همان ستونِ خامِ `users.vip_expires_at` که `isUserVip()` (src/lib/vip/vipStatus.ts، و اکنون
// نسخه‌ی کپی‌شده‌ی مشابهش در پروژه‌ی موبایل) برای محاسبه‌ی وضعیتِ VIP نیاز دارد. بدون این فیلد،
// موبایل هیچ راهی برای دانستنِ «آیا این کاربر VIP است؟» نداشت.
//
// - GET: دقیقاً همان getCurrentUser() که خودِ صفحه‌ی وب برای گرفتن کاربر فعلی صدا می‌زند؛ اینجا
//   فقط خروجی‌اش به JSON تبدیل می‌شود. کاربر مهمان (بدون نشست معتبر) خطا نیست — دقیقاً هم‌رفتار
//   با وب که برای کاربر مهمان هم به‌جای خطا، کارت دعوت به ورود نشان می‌دهد؛ اینجا هم `user: null`
//   برمی‌گردد، نه یک کد وضعیت خطا.
//
// - PATCH: دقیقاً همان به‌روزرسانیِ ستون users.language که switchLanguageAction وب انجام می‌دهد —
//   اما به‌جای فراخوانی مستقیم خودِ switchLanguageAction (که در کنار همین کار، cookies().set و
//   redirect() مخصوص مرورگر را هم اجرا می‌کند و در یک Route Handler/اپ موبایل بی‌معناست)، تابع
//   مشترکِ تازه‌استخراج‌شده‌ی updateUserLanguage مستقیم صدا زده می‌شود.
//
// GET — بدون بدنه‌ی ورودی.
//   خروجی برای کاربر واردشده:
//     { success: true, user: { id, phoneNumber, name, role, language, vipExpiresAt } }
//   خروجی برای کاربر مهمان:
//     { success: true, user: null }
//
// PATCH — بدنه: { "language": "fa" | "ps" }
//   خروجی موفق (چه کاربر واردشده، چه مهمان): { success: true, language }
//   خروجی ناموفق: { success: false, error: "invalidLocale" } با کد ۴۰۰.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateUserLanguage } from "@/app/[lang]/profile/actions";
import { isValidLocale } from "@/lib/i18n/constants";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: true, user: null });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      language: user.language,
      vipExpiresAt: user.vipExpiresAt,
    },
  });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalidLocale" }, { status: 400 });
  }

  const languageInput =
    typeof body === "object" && body !== null && typeof (body as { language?: unknown }).language === "string"
      ? (body as { language: string }).language
      : "";

  if (!isValidLocale(languageInput)) {
    return NextResponse.json({ success: false, error: "invalidLocale" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (user) {
    await updateUserLanguage(user.id, languageInput);
  }

  return NextResponse.json({ success: true, language: languageInput });
}