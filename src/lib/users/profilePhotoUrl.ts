// مسیر فایل: src/lib/users/profilePhotoUrl.ts
// ساخت آدرس عمومی (Public URL) عکس پروفایل از روی مسیر ذخیره‌شده در ستون users.photo_path —
// دقیقاً هم‌الگو با src/lib/stories/images.ts / src/lib/marketplace/images.ts.
const PROFILE_PHOTOS_BUCKET = "profile-photos";

export function getProfilePhotoUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${PROFILE_PHOTOS_BUCKET}/${path}`;
}