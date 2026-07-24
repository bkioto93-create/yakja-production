// مسیر فایل: src/lib/auth/adminPassword.ts
// تسک ۱ فاز ۰۷ — هش‌سازی و اعتبارسنجی رمزعبور مسیر ورود مجزای ادمین.
// عمداً هیچ وابستگی بیرونی (مثل bcrypt) اضافه نشد؛ همان الگوی src/lib/auth/session.ts (استفاده
// از ماژول داخلی node:crypto) دنبال شد. الگوریتم scrypt (توصیه‌شده‌ی خودِ Node.js برای هش رمزعبور،
// در برابر حمله‌ی brute-force با سخت‌افزار تخصصی «gpu/asic» مقاوم‌تر از sha256 ساده است) با یک
// «نمک» (salt) تصادفی و مجزا برای هر رمزعبور استفاده می‌شود. مقدار ذخیره‌شده در ستون
// users.admin_password_hash همیشه به‌شکل `salt:hash` (هر دو hex) است.
//
// هرگز رمزعبور خام در پایگاه داده یا لاگ سرور ذخیره یا چاپ نمی‌شود؛ فقط همین هش.
import "server-only";
import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

// مقایسه با crypto.timingSafeEqual انجام می‌شود (نه ===) تا در برابر حمله‌ی زمان‌سنجی
// (timing attack) هم مقاوم باشد — دقیقاً هم‌الگو با بررسی امضای کوکی نشست در session.ts.
export function verifyAdminPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;

  const expectedKey = Buffer.from(keyHex, "hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);

  if (expectedKey.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(expectedKey, derivedKey);
}