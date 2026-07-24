// مسیر فایل: src/app/[lang]/transport/constants.ts
// این فایل جدید است. علتش: فایل‌های "use server" فقط اجازه دارند async function
// export کنند؛ export کردن یک ثابت ساده (DRIVERS_PAGE_SIZE) از actions.ts باعث
// همان خطای Build می‌شد. بنابراین این ثابت از actions.ts به این فایل مجزا منتقل شد
// و همه‌ی فایل‌هایی که قبلاً آن را از actions.ts می‌گرفتند (ActiveDriversList.tsx و
// page.tsx) حالا آن را از همین‌جا می‌گیرند.

export const DRIVERS_PAGE_SIZE = 20;