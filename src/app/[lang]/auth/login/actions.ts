// مسیر فایل: src/app/[lang]/auth/login/actions.ts
// تسک ۳/۴ فاز ۰۱ — درخواست کد OTP برای شماره‌ی وارد‌شده.
"use server";

import { smsProvider } from "@/lib/sms/activeProvider";
import { normalizeAfghanPhone } from "@/lib/phone";

export async function requestOtpAction(phoneInput: string) {
  const phoneNumber = normalizeAfghanPhone(phoneInput);
  if (!phoneNumber) {
    return {
      success: false as const,
      error: "invalidPhone",
      retryAfterSeconds: undefined as number | undefined,
    };
  }

  const result = await smsProvider.sendOtp(phoneNumber);
  if (!result.success) {
    return {
      success: false as const,
      error: result.error ?? "generic",
      retryAfterSeconds: result.retryAfterSeconds,
    };
  }

  return {
    success: true as const,
    phoneNumber,
    retryAfterSeconds: undefined as number | undefined,
  };
}