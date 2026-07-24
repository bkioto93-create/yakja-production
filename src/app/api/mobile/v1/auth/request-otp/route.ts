// مسیر فایل: src/app/api/mobile/v1/auth/request-otp/route.ts
// تسک ۲ فاز M01 (لایه‌ی API موبایل، بخش الف) — نسخه‌ی HTTP-محورِ همان جریان «درخواست کد OTP»ی
// که در وب با requestOtpAction (src/app/[lang]/auth/login/actions.ts) انجام می‌شود.
//
// طبق بند ۵ سند راهبردی موبایل و اصل بنیادین کل این فاز: این Route Handler هیچ منطق تجاری
// تازه‌ای نمی‌نویسد — چون requestOtpAction از قبل نوشته و در وب تست شده (اعتبارسنجی شماره با
// normalizeAfghanPhone، محدودیت ارسال مجدد زودهنگام، محدودیت تعداد درخواست ساعتی، ثبت کد در
// otp_codes از طریق smsProvider.sendOtp)، همان تابع مستقیم فراخوانی می‌شود و فقط خروجی‌اش به
// شکل JSON برای اپ موبایل (که — برخلاف مرورگر — نمی‌تواند مستقیم یک Server Action صدا بزند)
// برگردانده می‌شود. صفر تصمیم امنیتی/تجاری تازه در این فایل گرفته شده.
//
// بدنه‌ی درخواست: { "phoneNumber": "07xxxxxxxx" } (هر فرمتی که normalizeAfghanPhone قبول دارد:
// با/بدون کد کشور، با/بدون صفر ابتدایی — دقیقاً همان ورودی که فرم وب هم می‌پذیرد).
import "server-only";
import { NextResponse } from "next/server";
import { requestOtpAction } from "@/app/[lang]/auth/login/actions";

// کد خطا → کد وضعیت HTTP، دقیقاً منطبق با معنای واقعی هر خطا در smsProvider/requestOtpAction:
// invalidPhone یک خطای ورودی کاربر است (۴۰۰)؛ cooldown/rateLimited یعنی «فعلاً تعداد/زمان
// درخواست از حد مجاز گذشته» (۴۲۹)؛ dbError یک خطای داخلی سرور است (۵۰۰). هر کد ناشناخته‌ی دیگر
// هم برای احتیاط ۵۰۰ در نظر گرفته می‌شود.
const ERROR_STATUS: Record<string, number> = {
  invalidPhone: 400,
  cooldown: 429,
  rateLimited: 429,
  dbError: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalidPhone" }, { status: 400 });
  }

  const phoneInput =
    typeof body === "object" && body !== null && typeof (body as { phoneNumber?: unknown }).phoneNumber === "string"
      ? (body as { phoneNumber: string }).phoneNumber
      : "";

  const result = await requestOtpAction(phoneInput);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, retryAfterSeconds: result.retryAfterSeconds },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({
    success: true,
    phoneNumber: result.phoneNumber,
  });
}