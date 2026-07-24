// مسیر فایل: src/lib/sms/mockProvider.ts
// پیاده‌سازی Mock/Dev Provider — تسک ۴ و ۵ فاز ۰۱ و بند ۸.۲.۲/۸.۳ سند راهبردی.
// این پیاده‌سازی، کد OTP را در جدول otp_codes ذخیره می‌کند (برای نمایش در پنل مدیریت،
// بخش «پیامک‌ها») و برای بوت‌استرپ اولین ورود ادمین، در لاگ سرور هم چاپ می‌کند.
// هیچ پیامک واقعی ارسال نمی‌شود. جایگزینی این فایل با یک Provider واقعی (بند ۸.۲.۴)،
// هیچ تغییری در بقیه‌ی پروژه لازم ندارد چون همه‌جا فقط رابط SmsProvider فراخوانی می‌شود.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { SmsProvider, OtpResult } from "./smsProvider";

const OTP_LENGTH_MIN = 100000;
const OTP_LENGTH_RANGE = 900000;
const OTP_EXPIRY_MINUTES = 2;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function generateCode(): string {
  return String(Math.floor(OTP_LENGTH_MIN + Math.random() * OTP_LENGTH_RANGE));
}

class MockSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string): Promise<OtpResult> {
    // ۱. محدودسازی ارسال مجدد زودهنگام (Resend Cooldown) — تسک ۴
    const { data: lastCode } = await supabaseAdminClient
      .from("otp_codes")
      .select("id, created_at")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCode) {
      const secondsSinceLast = (Date.now() - new Date(lastCode.created_at).getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return {
          success: false,
          error: "cooldown",
          retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast),
        };
      }
    }

    // ۲. محدودسازی تعداد درخواست در بازه یک‌ساعته (جلوگیری از سوءاستفاده) — تسک ۴
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdminClient
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("phone_number", phoneNumber)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
      return { success: false, error: "rateLimited" };
    }

    // ۳. تولید و ذخیره‌ی کد جدید
    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error } = await supabaseAdminClient.from("otp_codes").insert({
      phone_number: phoneNumber,
      code,
      expires_at: expiresAt,
      is_used: false,
      attempts: 0,
    });

 if (error) {
      console.error("[YAKJA][OTP Insert Error]", error);
      return { success: false, error: "dbError" };
    }

    // Mock/Dev Provider: به‌جای ارسال پیامک واقعی، کد را در لاگ سرور چاپ می‌کند (بند ۸.۳ —
    // این کد هم‌زمان در بخش «پیامک‌ها»ی پنل مدیریت هم قابل مشاهده است).
    console.log(
      `[YAKJA][Mock SMS] کد ورود برای ${phoneNumber}: ${code} (انقضا: ${OTP_EXPIRY_MINUTES} دقیقه)`
    );

    return { success: true };
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<OtpResult> {
    const { data: record, error } = await supabaseAdminClient
      .from("otp_codes")
      .select("id, code, expires_at, is_used, attempts")
      .eq("phone_number", phoneNumber)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !record) {
      return { success: false, error: "notFound" };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { success: false, error: "expired" };
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await supabaseAdminClient.from("otp_codes").update({ is_used: true }).eq("id", record.id);
      return { success: false, error: "tooManyAttempts" };
    }

    if (record.code !== code) {
      await supabaseAdminClient
        .from("otp_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      return { success: false, error: "wrongCode" };
    }

    await supabaseAdminClient.from("otp_codes").update({ is_used: true }).eq("id", record.id);
    return { success: true };
  }
}

export const mockSmsProvider = new MockSmsProvider();