// مسیر فایل: src/lib/pwaInstall/constants.ts
// ثابت‌های کوکی «رد کردن موقت پیشنهاد نصب PWA» — دقیقاً هم‌الگو با src/lib/disclaimer/constants.ts.
// برخلاف کوکی سلب مسئولیت (یک‌بار و همیشگی، یک سال)، این کوکی عمداً کوتاه‌مدت‌تر است: اگر کاربر
// الان نخواهد نصب کند («شاید بعداً»)، منطقی است بعد از مدتی دوباره از او پرسیده شود — نه هرگز.

export const PWA_INSTALL_COOKIE_NAME = "yakja_pwa_install_dismissed";
export const PWA_INSTALL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // ۳۰ روز