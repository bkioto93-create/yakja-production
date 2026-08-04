// مسیر فایل: src/app/[lang]/stories/actions.ts
// صفحه‌ی «همه استوری‌ها» — تنها اکشن سروری این صفحه: گرفتن دسته‌ی بعدیِ استوری‌ها.
//
// چرا اصلاً یک Server Action لازم است: خودِ src/lib/stories/storyQueries.ts با "server-only"
// علامت‌گذاری شده و نمی‌تواند مستقیماً از یک کامپوننت کلاینت import شود (اگر می‌شد، کلید سرویس
// Supabase به باندل مرورگر نشت می‌کرد). این فایل فقط یک پوسته‌ی نازک و امن دور همان تابع است —
// دقیقاً هم‌الگو با getUserStoriesAction در src/app/[lang]/profile/storyActions.ts.
//
// **رفع خطای بیلد (Turbopack):** این فایل عمداً *فقط* توابع async را export می‌کند. مقادیر
// ثابت (مثل اندازه‌ی هر دسته) به ./constants.ts منتقل شده‌اند، چون یک فایلِ "use server" اجازه
// ندارد چیزی جز تابع async صادر کند — رجوع کنید به توضیح کامل در همان فایل constants.ts.
//
// نکته‌ی امنیتی: این اکشن هیچ داده‌ی خصوصی‌ای برنمی‌گرداند و نیازی به بررسی نشست ندارد —
// استوری‌های فعال ذاتاً عمومی‌اند (همان‌هایی که در صفحه‌ی اصلی هم به همه نشان داده می‌شوند).
// تنها ورودی کاربر، مقدار cursor است که مستقیم به‌عنوان یک فیلترِ تاریخ استفاده می‌شود، نه در
// هیچ کوئری خامِ SQL — پس جای تزریق ندارد.
"use server";

import { fetchStoriesPage, type StoriesPage } from "@/lib/stories/storyQueries";
import { STORIES_PAGE_SIZE, STORIES_MAX_PAGE_SIZE } from "./constants";

export async function loadMoreStoriesAction(cursor: string | null): Promise<StoriesPage> {
  // اعتبارسنجی cursor: باید یک تاریخ ISO معتبر باشد، وگرنه نادیده گرفته می‌شود (یعنی از ابتدا).
  const safeCursor =
    typeof cursor === "string" && !Number.isNaN(Date.parse(cursor)) ? cursor : null;

  return fetchStoriesPage(Math.min(STORIES_PAGE_SIZE, STORIES_MAX_PAGE_SIZE), safeCursor);
}