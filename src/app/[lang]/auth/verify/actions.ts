// مسیر فایل: src/app/[lang]/auth/verify/actions.ts
// تسک ۶/۷ فاز ۰۱ — تایید کد OTP، ساخت/به‌روزرسانی کاربر در جدول users، و ساخت نشست.
// **به‌روزرسانی تسک ۱ فاز ۰۷:** createSession از این پس صراحتاً authMethod="otp" را پاس می‌دهد.
// نشستی که از همین‌جا ساخته می‌شود، حتی اگر متعلق به ردیفی با role='admin' باشد، دیگر هرگز اجازه‌ی
// ورود به پنل مدیریت (`/admin/*`) را نمی‌دهد — طبق بررسی authMethod در requireAdmin
// (src/lib/auth/session.ts). مسیر مستقل ورود ادمین از این پس فقط src/app/[lang]/admin/login است.
//
// **به‌روزرسانی تسک ۳ فاز M01 (verify-otp موبایل):** یک فیلد تازه‌ی `token` به مقدار بازگشتیِ
// موفق اضافه شد — همان رشته‌ی نشستِ امضاشده‌ای که `createSession` حالا برمی‌گرداند (به‌جای اینکه
// فقط داخلی در کوکی گذاشته شود). این افزودن کاملاً افزایشی/Additive است: خودِ `VerifyClient.tsx`
// وب فقط به `result.success` نگاه می‌کند و هرگز `result.token` را نمی‌خواند، پس هیچ رفتاری برای
// وب عوض نشد. تنها مصرف‌کننده‌ی این فیلد تازه، Route Handler موبایل
// (src/app/api/mobile/v1/auth/verify-otp/route.ts) است که همین توکن را در بدنه‌ی JSON پاسخ به
// اپ برمی‌گرداند تا در expo-secure-store ذخیره شود.
"use server";

import { smsProvider } from "@/lib/sms/activeProvider";
import { requestOtpAction } from "../login/actions";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/session";
import { isValidLocale, type Locale } from "@/lib/i18n/constants";

export async function verifyOtpAction(phoneNumber: string, code: string, language: string) {
  const safeLanguage: Locale = isValidLocale(language) ? language : "fa";

  const result = await smsProvider.verifyOtp(phoneNumber, code);
  if (!result.success) {
    return { success: false as const, error: result.error ?? "generic" };
  }

  // تسک ۷ فاز ۰۱ — یافتن یا ساخت کاربر پس از تایید موفق OTP.
  const { data: existingUser } = await supabaseAdminClient
    .from("users")
    .select("id, is_blocked, role")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (existingUser?.is_blocked) {
    return { success: false as const, error: "blocked" };
  }

  let userId: string;
  let role: string;

  if (existingUser) {
    userId = existingUser.id;
    role = existingUser.role;
    await supabaseAdminClient
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);
  } else {
    const { data: newUser, error: insertError } = await supabaseAdminClient
      .from("users")
      .insert({
        phone_number: phoneNumber,
        role: "user",
        language: safeLanguage,
        last_login: new Date().toISOString(),
      })
      .select("id, role")
      .single();

    if (insertError || !newUser) {
      return { success: false as const, error: "dbError" };
    }
    userId = newUser.id;
    role = newUser.role;
  }

  const token = await createSession(userId, "otp");

  return { success: true as const, role, token };
}

export async function resendOtpAction(phoneNumber: string) {
  return requestOtpAction(phoneNumber);
}