// مسیر فایل: src/app/api/mobile/v1/profile/route.ts
// تسک ۴ فاز M01 (لایه‌ی API موبایل، بخش الف) — نسخه‌ی HTTP-محورِ همان صفحه‌ی «تنظیمات پروفایل»ی
// که در وب با src/app/[lang]/profile/page.tsx (خواندن کاربر) و
// src/app/[lang]/profile/actions.ts::switchLanguageAction (تغییر زبان) انجام می‌شود.
//
// طبق همان اصل بنیادین تسک‌های ۲ و ۳ همین فاز (بند ۵ سند راهبردی موبایل): این Route Handler
// هیچ منطق تجاری تازه‌ای نمی‌نویسد.
//
// - GET: دقیقاً همان getCurrentUser() که خودِ صفحه‌ی وب برای گرفتن کاربر فعلی صدا می‌زند؛ اینجا
//   فقط خروجی‌اش به JSON تبدیل می‌شود. کاربر مهمان (بدون نشست معتبر) خطا نیست — دقیقاً هم‌رفتار
//   با وب که برای کاربر مهمان هم به‌جای خطا، کارت دعوت به ورود نشان می‌دهد؛ اینجا هم `user: null`
//   برمی‌گردد، نه یک کد وضعیت خطا.
//
// - PATCH: دقیقاً همان به‌روزرسانیِ ستون users.language که switchLanguageAction وب انجام می‌دهد —
//   اما به‌جای فراخوانی مستقیم خودِ switchLanguageAction (که در کنار همین کار، cookies().set و
//   redirect() مخصوص مرورگر را هم اجرا می‌کند و در یک Route Handler/اپ موبایل بی‌معناست)، تابع
//   مشترکِ تازه‌استخراج‌شده‌ی updateUserLanguage مستقیم صدا زده می‌شود (همان تغییر افزایشی تسک ۴
//   داخل src/app/[lang]/profile/actions.ts).
//
// **⚠️ رفع یافته‌ی ممیزی تسک ۶ همین فاز:** نسخه‌ی اولیه‌ی این فایل (تسک ۴) برای کاربر مهمان از
// PATCH کد ۴۰۱ (`unauthorized`) برمی‌گرداند. بررسی دقیق‌تر نشان داد این با رفتار واقعی
// switchLanguageAction وب هم‌خوان نیست: آن تابع اصلاً هیچ‌وقت به‌خاطر نبودِ نشست خطا نمی‌دهد —
// برای کاربر مهمان هم زبان را عوض می‌کند (فقط بخشِ «هم‌گام‌سازی با ستون users.language» را رد
// می‌کند، چون دیتابیس رکوردی برای کاربر مهمان ندارد). طبق تسک ۶ («هر Route جدید از همان بررسی
// که Server Action معادلش استفاده می‌کرد عبور کند») این مسیر اصلاح شد تا دقیقاً همین رفتارِ
// تحمل‌گر (Tolerant) را تکرار کند: دیگر هیچ حالتی از PATCH با ۴۰۱ برنمی‌گردد؛ اگر نشست معتبر
// بود، updateUserLanguage صدا زده می‌شود، وگرنه به‌سادگی رد می‌شود — در هر دو حالت پاسخ موفق است.
// (در عمل، اپِ موبایل چون سوییچ زبانِ محلی‌اش کاملاً مستقل و بدون نیاز به ورود کار می‌کند، اصلاً
// این Route را برای کاربر مهمان صدا نمی‌زند؛ این اصلاح فقط برای هم‌خوانیِ کامل و دقیق با معنای
// واقعیِ Server Action معادلِ وب است، نه یک نیاز واقعی از سمت رابط کاربری.)
//
// GET — بدون بدنه‌ی ورودی.
//   خروجی برای کاربر واردشده:
//     { success: true, user: { phoneNumber, name, role, language } }
//   خروجی برای کاربر مهمان:
//     { success: true, user: null }
//
// PATCH — بدنه: { "language": "fa" | "ps" }
//   خروجی موفق (چه کاربر واردشده، چه مهمان): { success: true, language }
//   خروجی ناموفق: { success: false, error: "invalidLocale" } با کد ۴۰۰ — تنها حالتِ خطا (مقدار
//   زبان نامعتبر یا غایب)؛ هیچ حالت ۴۰۱ای وجود ندارد (طبق رفع یافته‌ی بالا).
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
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      language: user.language,
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

  // هم‌الگو با switchLanguageAction وب: اگر نشست معتبر بود، دیتابیس هم‌گام می‌شود؛ اگر نبود
  // (کاربر مهمان)، به‌سادگی رد می‌شود — نه یک خطا. رفع یافته‌ی ممیزی تسک ۶ (بالا).
  const user = await getCurrentUser();
  if (user) {
    await updateUserLanguage(user.id, languageInput);
  }

  return NextResponse.json({ success: true, language: languageInput });
}