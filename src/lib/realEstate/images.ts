// مسیر فایل: src/lib/realEstate/images.ts
// تسک ۶ فاز ۰۵ — ساخت آدرس عمومی (Public URL) تصاویر آگهی ملک از روی مسیر ذخیره‌شده در ستون
// real_estate.images (مثلاً "owner-uuid/167000_0.jpg")، دقیقاً هم‌الگو با
// src/lib/marketplace/images.ts (فاز ۰۲، تسک ۶). چون باکت real-estate-images از فاز ۰۰ «عمومی»
// (public) تعریف شده، این آدرس بدون نیاز به هیچ Sign کردنی، مستقیماً در مرورگر باز می‌شود.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** getRealEstateVideoUrl اضافه شد — اشاره به باکت تازه‌ی
// real-estate-videos (رجوع کنید به 22_phase_11_vip_membership.sql).
const REAL_ESTATE_BUCKET = "real-estate-images";
const REAL_ESTATE_VIDEOS_BUCKET = "real-estate-videos";

export function getRealEstateImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${REAL_ESTATE_BUCKET}/${path}`;
}

export function getRealEstateVideoUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${REAL_ESTATE_VIDEOS_BUCKET}/${path}`;
}