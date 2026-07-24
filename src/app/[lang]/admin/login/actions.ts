// مسیر فایل: src/app/[lang]/admin/login/actions.ts
// تسک ۱ فاز ۰۷ — ورود مدیر از طریق نام‌کاربری+رمزعبور، کاملاً جدا از جریان عمومی OTP
// (src/app/[lang]/auth/login و src/app/[lang]/auth/verify). این اکشن هرگز از جدول otp_codes یا
// smsProvider استفاده نمی‌کند.
"use server";

import { supabaseAdminClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/session";
import { verifyAdminPassword } from "@/lib/auth/adminPassword";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

type AdminLoginResult =
  | { success: true }
  | { success: false; error: "invalidCredentials" | "blocked" | "locked" | "dbError" };

export async function adminLoginAction(
  usernameInput: string,
  password: string
): Promise<AdminLoginResult> {
  const username = usernameInput.trim().toLowerCase();
  if (!username || !password) {
    return { success: false, error: "invalidCredentials" };
  }

  const { data: admin, error } = await supabaseAdminClient
    .from("users")
    .select(
      "id, role, is_blocked, admin_password_hash, admin_failed_attempts, admin_locked_until"
    )
    .eq("admin_username", username)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    return { success: false, error: "dbError" };
  }

  // پیام خطای «نام‌کاربری یا رمزعبور اشتباه است» عمداً برای هر دو حالتِ «نام‌کاربری یافت نشد» و
  // «رمزعبور اشتباه است» یکسان است تا امکان حدس زدن نام‌های کاربری معتبر (username enumeration)
  // از طریق تفاوت پیام خطا وجود نداشته باشد.
  if (!admin || !admin.admin_password_hash) {
    return { success: false, error: "invalidCredentials" };
  }

  if (admin.is_blocked) {
    return { success: false, error: "blocked" };
  }

  if (admin.admin_locked_until && new Date(admin.admin_locked_until) > new Date()) {
    return { success: false, error: "locked" };
  }

  const isValid = verifyAdminPassword(password, admin.admin_password_hash);

  if (!isValid) {
    const nextAttempts = (admin.admin_failed_attempts ?? 0) + 1;
    const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;

    await supabaseAdminClient
      .from("users")
      .update({
        admin_failed_attempts: shouldLock ? 0 : nextAttempts,
        admin_locked_until: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
          : null,
      })
      .eq("id", admin.id);

    return { success: false, error: shouldLock ? "locked" : "invalidCredentials" };
  }

  // ورود موفق — شمارنده‌ی تلاش‌های ناموفق صفر می‌شود و نشست با authMethod="password" ساخته
  // می‌شود (نه "otp")؛ همین مقدار است که در src/lib/auth/session.ts، تابع requireAdmin، جدا از
  // هر نشست OTP بررسی می‌شود.
  await supabaseAdminClient
    .from("users")
    .update({
      admin_failed_attempts: 0,
      admin_locked_until: null,
      last_login: new Date().toISOString(),
    })
    .eq("id", admin.id);

  await createSession(admin.id, "password");

  return { success: true };
}