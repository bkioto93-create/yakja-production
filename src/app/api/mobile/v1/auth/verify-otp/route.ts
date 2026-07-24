// مسیر فایل: src/app/api/mobile/v1/auth/verify-otp/route.ts
// تسک ۳ فاز M01 (لایه‌ی API موبایل، بخش الف) — نسخه‌ی HTTP-محورِ همان جریان «تایید کد OTP»ی که
// در وب با verifyOtpAction (src/app/[lang]/auth/verify/actions.ts) انجام می‌شود.
//
// طبق همان اصل بنیادین تسک ۲: هیچ منطق تجاری/امنیتی تازه‌ای اینجا نوشته نمی‌شود — همان
// verifyOtpAction موجود و تست‌شده (تایید کد، یافتن/ساخت کاربر، ساخت نشست) مستقیم فراخوانی
// می‌شود. تنها تفاوت با نسخه‌ی وب: به‌جای این‌که توکن نشست فقط در یک کوکی httpOnly بنشیند
// (که اپ موبایل اصلاً نمی‌بیندش)، در بدنه‌ی همین پاسخ JSON هم برگردانده می‌شود — دقیقاً طبق بند ۵
// سند راهبردی موبایل. این توکن را verifyOtpAction/createSession تولید کرده‌اند (تغییر افزایشی
// تسک ۳ در src/lib/auth/session.ts)؛ این فایل صرفاً همان مقدار را عبور می‌دهد، چیزی امضا نمی‌کند.
//
// بدنه‌ی درخواست: { "phoneNumber": "+93...", "code": "123456", "language": "fa" | "ps" }
// phoneNumber باید همان مقدارِ نرمال‌شده‌ای باشد که پاسخ موفق request-otp (تسک ۲) برگرداند —
// دقیقاً همان قراردادی که فرم وب هم بین صفحه‌ی ورود و صفحه‌ی تایید رعایت می‌کند.
import "server-only";
import { NextResponse } from "next/server";
import { verifyOtpAction } from "@/app/[lang]/auth/verify/actions";

// کد خطا → کد وضعیت HTTP، منطبق با معنای واقعی هر خطا در smsProvider.verifyOtp/verifyOtpAction:
// wrongCode/notFound/expired یعنی ورودی کاربر با نشست فعلی OTP هم‌خوان نیست (۴۰۰)؛
// tooManyAttempts یعنی سقف تلاش پر شده (۴۲۹)؛ blocked یعنی حساب کاربر مسدود است (۴۰۳)؛
// dbError یک خطای داخلی سرور است (۵۰۰). هر کد ناشناخته‌ی دیگر هم برای احتیاط ۵۰۰ می‌گیرد.
const ERROR_STATUS: Record<string, number> = {
  wrongCode: 400,
  notFound: 400,
  expired: 400,
  tooManyAttempts: 429,
  blocked: 403,
  dbError: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const parsed = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const phoneNumber = typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : "";
  const code = typeof parsed.code === "string" ? parsed.code : "";
  const language = typeof parsed.language === "string" ? parsed.language : "fa";

  if (!phoneNumber || !code) {
    return NextResponse.json({ success: false, error: "generic" }, { status: 400 });
  }

  const result = await verifyOtpAction(phoneNumber, code, language);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({
    success: true,
    token: result.token,
    role: result.role,
  });
}