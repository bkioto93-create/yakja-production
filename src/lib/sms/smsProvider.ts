// مسیر فایل: src/lib/sms/smsProvider.ts
// بند ۸.۲ سند راهبردی — لایه‌ی انتزاعی «رابط پیامک» (SMS Provider Interface)
//
// **به‌روزرسانی تسک ۴/۵ فاز ۰۱:** فیلد اختیاری retryAfterSeconds به OtpResult اضافه شد تا در حالت
// «هنوز زود است دوباره درخواست بدهید» (Resend Cooldown)، شمارنده‌ی دقیق ثانیه به رابط کاربری برسد.
// این افزودن، افزایشی (Additive) است و هیچ پیاده‌سازی قبلی را نقض نمی‌کند.
//
// مقدار error همیشه یک «کد کوتاه انگلیسی» است (مثلاً "wrongCode")، نه متن نهایی کاربر؛
// ترجمه‌ی این کدها به دری/پشتو در دیکشنری‌ها (dict.auth.errors) انجام می‌شود — طبق الزام قطعی ۲.

export interface OtpResult {
  success: boolean;
  error?: string;
  retryAfterSeconds?: number;
}

export interface SmsProvider {
  /**
   * ارسال کد OTP به شماره‌ی موبایل داده‌شده.
   * @param phoneNumber شماره‌ی موبایل به‌فرمت بین‌المللی (مثلاً +93...)
   */
  sendOtp(phoneNumber: string): Promise<OtpResult>;

  /**
   * بررسی صحت کد OTP وارد‌شده توسط کاربر برای شماره‌ی مشخص.
   * @param phoneNumber شماره‌ی موبایل به‌فرمت بین‌المللی
   * @param code کد OTP وارد‌شده توسط کاربر
   */
  verifyOtp(phoneNumber: string, code: string): Promise<OtpResult>;
}