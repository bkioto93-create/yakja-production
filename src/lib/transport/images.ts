// مسیر فایل: src/lib/transport/images.ts
// ساخت آدرس عمومی (Public URL) تصاویر پروفایل راننده از روی مسیر ذخیره‌شده در ستون
// drivers.images (مثلاً "owner-uuid/167000_0.jpg"). چون باکت drivers-images از فاز ۰۰ «عمومی»
// (public) تعریف شده، این آدرس بدون نیاز به هیچ Sign کردنی، مستقیماً در مرورگر باز می‌شود —
// دقیقاً هم‌الگو با src/lib/marketplace/images.ts.
const DRIVERS_BUCKET = "drivers-images";

export function getDriverImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${DRIVERS_BUCKET}/${path}`;
}
