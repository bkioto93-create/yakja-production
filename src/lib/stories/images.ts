// مسیر فایل: src/lib/stories/images.ts
// ساخت آدرس عمومی (Public URL) فایل رسانه‌ی استوری از روی مسیر ذخیره‌شده در ستون
// stories.media_path — دقیقاً هم‌الگو با src/lib/marketplace/images.ts (getListingImageUrl/
// getListingVideoUrl). چون باکت stories «عمومی» تعریف شده (رجوع کنید به
// database/2026_08_stories_feature.sql)، این آدرس بدون نیاز به Sign کردن مستقیماً در مرورگر یا
// تگ <video>/<img> باز می‌شود. عمداً بدون وابستگی به کلاینت Supabase نوشته شده (فقط رشته‌سازی
// ساده با NEXT_PUBLIC_SUPABASE_URL) تا هم در کامپوننت‌های سرور و هم کلاینت بدون مشکل قابل
// استفاده باشد.
const STORIES_BUCKET = "stories";

export function getStoryMediaUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${STORIES_BUCKET}/${path}`;
}