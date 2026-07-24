// مسیر فایل: scripts/hash-admin-password.mjs
// اسکریپت کمکی خط‌فرمان — تسک ۱ فاز ۰۷. چون هیچ رمزعبور خامی هرگز نباید مستقیم در SQL یا
// دیتابیس نوشته شود، این اسکریپت همان الگوریتم دقیقِ src/lib/auth/adminPassword.ts
// (scrypt + نمکِ تصادفی، به‌شکل خروجی `salt:hash`) را به‌صورت مستقل (بدون نیاز به اجرای کل
// پروژه‌ی Next.js) اجرا می‌کند تا مدیر بتواند هش رمزعبور اولین حساب ادمین را بسازد.
//
// نحوه‌ی اجرا (از ریشه‌ی پروژه، در ترمینال):
//
//     node scripts/hash-admin-password.mjs "رمزعبور-دلخواه-شما"
//
// خروجی را کپی کنید و در دستور SQL بوت‌استرپ (sql/2026-07-19_phase07_task1_admin_login.sql)
// به‌جای PASTE_THE_GENERATED_HASH_HERE جای‌گذاری کنید.
import crypto from "node:crypto";

const KEY_LENGTH = 64;

function hashAdminPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error(
    "خطا: رمزعبور را به‌عنوان آرگومان بدهید و حداقل ۸ کاراکتر باشد.\n" +
      'مثال: node scripts/hash-admin-password.mjs "رمزعبور-قوی-من-2026"'
  );
  process.exit(1);
}

const hash = hashAdminPassword(password);
console.log("\nهش رمزعبور شما آماده شد؛ این مقدار را در دستور SQL بوت‌استرپ جای‌گذاری کنید:\n");
console.log(hash);
console.log("");
