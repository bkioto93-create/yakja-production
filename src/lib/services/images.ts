// مسیر فایل: src/lib/services/images.ts
// ساخت آدرس عمومی (Public URL) تصاویر پروفایل متخصص از روی مسیر ذخیره‌شده در ستون
// service_providers.images. باکت service-providers-images از فاز ۰۰ «عمومی» تعریف شده — دقیقاً
// هم‌الگو با src/lib/marketplace/images.ts و src/lib/transport/images.ts.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** getServiceProviderVideoUrl اضافه شد — اشاره به باکت تازه‌ی
// service-providers-videos (رجوع کنید به 22_phase_11_vip_membership.sql).
const SERVICE_PROVIDERS_BUCKET = "service-providers-images";
const SERVICE_PROVIDERS_VIDEOS_BUCKET = "service-providers-videos";

export function getServiceProviderImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${SERVICE_PROVIDERS_BUCKET}/${path}`;
}

export function getServiceProviderVideoUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${SERVICE_PROVIDERS_VIDEOS_BUCKET}/${path}`;
}