// مسیر فایل: src/lib/users/publicProfileQueries.ts
// تکمیل گذشته‌نگر تسک ۳ فاز ۰۶ — لایه‌ی خواندن داده برای صفحه‌ی عمومی «پروفایل کاربر»
// (src/app/[lang]/users/[id]/page.tsx).
//
// طراحی عمدی: این پروفایل صرفاً «عمومی» است — یعنی فقط ستون‌های امن برای نمایش به هر بازدیدکننده
// (id، name، created_at) از جدول users خوانده می‌شود؛ هرگز phone_number یا role در اینجا
// برگردانده نمی‌شود.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** فیلد isVip اضافه شد — تیک VIP کنار نام کاربر در همین صفحه‌ی
// پروفایل عمومی هم دیده می‌شود (تکمیل طبیعی بند ۵ پرامپت VIP: «کنار نام/تماس فروشنده در همه‌ی این
// مکان‌ها»؛ این صفحه دقیقاً همان مکان است، فقط برای هر کاربر دیگر نه فقط خودِ کاربر).
// **به‌روزرسانی فاز ۱۴ (قابلیت استوری):** فیلد hasActiveStory اضافه شد — دقیقاً هم‌الگو با isVip
// (یک بولین سبک، بدون نیاز کامپوننت مصرف‌کننده به دانستن جزئیات جدول stories)، تا حلقه‌ی
// هایلایت دور آواتار این صفحه هم — دقیقاً مثل اینستاگرام — نشان داده شود.
// **به‌روزرسانی — عکس پروفایل کاربر:** فیلد photoUrl اضافه شد — فقط وقتی photo_status==='approved'
// مقدار می‌گیرد (وگرنه null)؛ دقیقاً همان قاعده‌ی «فقط تاییدشده در معرض دید عمومی» که در
// src/app/[lang]/profile/page.tsx هم برای approvedPhotoUrl رعایت شد.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { isUserVip } from "@/lib/vip/vipStatus";
import { hasActiveStory as checkHasActiveStory } from "@/lib/stories/storyQueries";
import { getProfilePhotoUrl } from "@/lib/users/profilePhotoUrl";

export type PublicUserProfile = {
  id: string;
  name: string | null;
  memberSinceYear: number;
  listingsCount: number;
  realEstateCount: number;
  isVip: boolean;
  hasActiveStory: boolean;
  photoUrl: string | null;
};

// خواندن پروفایل عمومیِ یک کاربر برای صفحه‌ی src/app/[lang]/users/[id]/page.tsx.
// اگر کاربر وجود نداشت یا مسدود (is_blocked) بود، null برمی‌گردد.
export async function getPublicUserProfile(id: string): Promise<PublicUserProfile | null> {
  const { data: user, error } = await supabaseAdminClient
    .from("users")
    .select("id, name, created_at, is_blocked, vip_expires_at, photo_path, photo_status")
    .eq("id", id)
    .maybeSingle();

  if (error || !user || user.is_blocked) return null;

  // دو شمارشِ سبک (count-only، بدون خواندن ردیف‌ها) برای «آگهی‌های فعال این کاربر» — فقط
  // آگهی‌های status='approved' شمرده می‌شوند، دقیقاً هم‌قاعده‌ی صفحه‌ی جزئیات هر آگهی.
  const [listingsResult, realEstateResult, ownerHasActiveStory] = await Promise.all([
    supabaseAdminClient
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id)
      .eq("status", "approved"),
    supabaseAdminClient
      .from("real_estate")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id)
      .eq("status", "approved"),
    checkHasActiveStory(id),
  ]);

  const photoUrl =
    user.photo_path && user.photo_status === "approved"
      ? getProfilePhotoUrl(user.photo_path as string)
      : null;

  return {
    id: user.id,
    name: user.name,
    memberSinceYear: new Date(user.created_at as string).getFullYear(),
    listingsCount: listingsResult.count ?? 0,
    realEstateCount: realEstateResult.count ?? 0,
    isVip: isUserVip(user.vip_expires_at as string | null),
    hasActiveStory: ownerHasActiveStory,
    photoUrl,
  };
}