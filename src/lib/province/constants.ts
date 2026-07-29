// مسیر فایل: src/lib/province/constants.ts
// فاز ۱۰ — ثابت‌های کوکی «ولایت انتخابی کاربر»، دقیقاً هم‌الگو با src/lib/disclaimer/constants.ts
// و src/lib/i18n/constants.ts (کوکی زبان): یک کوکی مستقل و بلندمدت.
//
// مقدار کوکی یا یکی از ۳۴ شناسه‌ی src/lib/provinces.ts است، یا رشته‌ی خاص "all" (یعنی «همه‌ی
// افغانستان» — کاربر عمداً انتخاب کرده که فیلتر ولایتی نمی‌خواهد). عمداً از کوکی زبان (yakja_lang)
// جدا نگه داشته شده تا سوییچ زبان، اثری روی ولایت انتخابی نداشته باشد.
export const PROVINCE_COOKIE_NAME = "yakja_province";
export const PROVINCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // یک سال

// مقدار ویژه‌ی «همه‌ی افغانستان» — یعنی بدون فیلتر ولایتی (رفتار قبلی/پیش‌فرض پروژه پیش از این فاز).
export const ALL_PROVINCES_VALUE = "all";