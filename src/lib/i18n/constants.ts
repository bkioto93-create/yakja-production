// مسیر فایل: src/lib/i18n/constants.ts
// ثابت‌های مشترک زبان — عمداً در یک فایل ساده (بدون "use server") نگه داشته شده تا هم داخل
// src/proxy.ts (که در محیط Edge اجرا می‌شود) و هم داخل Server Action مربوط به انتخاب زبان
// بدون مشکل import شود. هرگز این فایل را با actions.ts ادغام نکن.

export const LOCALES = ["fa", "ps"] as const;
export type Locale = (typeof LOCALES)[number];

export const LANG_COOKIE_NAME = "yakja_lang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // یک سال

export function isValidLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
