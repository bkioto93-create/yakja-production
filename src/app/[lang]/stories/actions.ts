// مسیر فایل: src/app/[lang]/stories/actions.ts
// صفحه‌ی «همه استوری‌ها» — تنها اکشن سروری این صفحه: گرفتن دسته‌ی بعدیِ استوری‌ها.
//
// چرا اصلاً یک Server Action لازم است: خودِ src/lib/stories/storyQueries.ts با "server-only"
// علامت‌گذاری شده و نمی‌تواند مستقیماً از یک کامپوننت کلاینت import شود (اگر می‌شد، کلید سرویس
// Supabase به باندل مرورگر نشت می‌کرد). این فایل فقط یک پوسته‌ی نازک و امن دور همان تابع است —
// دقیقاً هم‌الگو با getUserStoriesAction در src/app/[lang]/profile/storyActions.ts.
//
// نکته‌ی امنیتی: این اکشن هیچ داده‌ی خصوصی‌ای برنمی‌گرداند و نیازی به بررسی نشست ندارد —
// استوری‌های فعال ذاتاً عمومی‌اند (همان‌هایی که در صفحه‌ی اصلی هم به همه نشان داده می‌شوند).
// تنها ورودی کاربر، مقدار cursor است که مستقیم به‌عنوان یک فیلترِ تاریخ استفاده می‌شود، نه در
// هیچ کوئری خامِ SQL — پس جای تزریق ندارد. سقف تعداد هم سمت سرور محدود می‌شود (پایین را ببینید).
"use server";

import { fetchStoriesPage, type StoriesPage } from "@/lib/stories/storyQueries";

// همان مقداری که صفحه در بارگذاری اول استفاده می‌کند. عمداً کوچک نگه داشته شده — طبق بند صریح
// کارفرما درباره‌ی اینترنت ضعیف، هر دسته باید سبک باشد.
export const STORIES_PAGE_SIZE = 12;

// سقف سخت سمت سرور: حتی اگر یک کلاینت دستکاری‌شده عدد بزرگی بفرستد، هرگز بیش از این تعداد در
// یک درخواست خوانده نمی‌شود.
const MAX_PAGE_SIZE = 24;

export async function loadMoreStoriesAction(cursor: string | null): Promise<StoriesPage> {
  // اعتبارسنجی cursor: باید یک تاریخ ISO معتبر باشد، وگرنه نادیده گرفته می‌شود (یعنی از ابتدا).
  const safeCursor =
    typeof cursor === "string" && !Number.isNaN(Date.parse(cursor)) ? cursor : null;

  return fetchStoriesPage(Math.min(STORIES_PAGE_SIZE, MAX_PAGE_SIZE), safeCursor);
}