// مسیر فایل: src/app/[lang]/listings/constants.ts
// این مقدار قبلاً داخل actions.ts بود، اما فایل‌های "use server" در نسخه‌ی جدید Next.js
// فقط اجازه دارند async function اکسپورت کنند (نه const/variable ساده). به همین دلیل این
// مقدار به یک فایل جدا (بدون "use server") منتقل شد تا هم actions.ts معتبر بماند و هم
// همه‌ی جاهایی که قبلاً LISTINGS_PAGE_SIZE را از actions می‌گرفتند، بتوانند از اینجا بگیرند.

export const LISTINGS_PAGE_SIZE = 12;