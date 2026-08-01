// مسیر فایل: src/lib/marketplace/images.ts
// تسک ۶ فاز ۰۲ — ساخت آدرس عمومی (Public URL) تصاویر آگهی از روی مسیر ذخیره‌شده در ستون
// listings.images (مثلاً "owner-uuid/167000_0.jpg"). چون باکت listings-images از فاز ۰۰
// «عمومی» (public) تعریف شده، این آدرس بدون نیاز به هیچ Sign کردنی، مستقیماً در مرورگر باز
// می‌شود. این تابع عمداً بدون وابستگی به کلاینت Supabase نوشته شده (فقط رشته‌سازی ساده با
// NEXT_PUBLIC_SUPABASE_URL) تا هم در کامپوننت‌های سرور و هم کلاینت بدون مشکل قابل استفاده باشد.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** getListingVideoUrl اضافه شد — دقیقاً هم‌الگو با
// getListingImageUrl، فقط اشاره به باکت تازه‌ی listings-videos (رجوع کنید به
// 22_phase_11_vip_membership.sql) به‌جای listings-images.
const LISTINGS_BUCKET = "listings-images";
const LISTINGS_VIDEOS_BUCKET = "listings-videos";

export function getListingImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${LISTINGS_BUCKET}/${path}`;
}

export function getListingVideoUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${LISTINGS_VIDEOS_BUCKET}/${path}`;
}