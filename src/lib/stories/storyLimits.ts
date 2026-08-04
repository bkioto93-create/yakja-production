// مسیر فایل: src/lib/stories/storyLimits.ts
// قابلیت استوری — امتیاز صریح کارفرما: «کاربرهای معمولی فقط روزی ۱ بار می‌توانند استوری
// بگذارند؛ کاربر VIP نامحدود».
//
// طبق همان تصمیم تثبیت‌شده‌ی src/lib/vip/dailyPostLimit.ts (فاز ۱۱، سقف روزانه‌ی آگهی رایگان):
// مرز «روز» باید Asia/Kabul (UTC+4:30) باشد، نه UTC و نه نیمه‌شب سرور — افغانستان هیچ‌وقت ساعت
// تابستانی نداشته، پس افست ثابت +4:30 همیشه درست است. به‌جای بازتولید همان منطق، مستقیماً از
// همان تابع getStartOfTodayInKabulUtc استفاده می‌کنیم — یک منبع حقیقت برای «مرز روز» در کل
// پروژه، نه دو پیاده‌سازی موازی که ممکن است روزی از هم واگرا شوند.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getStartOfTodayInKabulUtc } from "@/lib/vip/dailyPostLimit";

export const FREE_DAILY_STORY_LIMIT = 1;

// شمارش «استوری‌های ثبت‌شده‌ی امروز» یک کاربر (به‌وقت کابل) — بدون در نظر گرفتن این‌که آن
// استوری هنوز فعال است یا قبلاً منقضی شده؛ سقف روی «تلاش برای ثبت در همان روز» اعمال می‌شود، نه
// روی «چند استوری الان زنده است» (دقیقاً هم‌قاعده‌ی سقف روزانه‌ی آگهی).
export async function getUserDailyStoryCount(userId: string): Promise<number> {
  const startOfToday = getStartOfTodayInKabulUtc().toISOString();

  const { count } = await supabaseAdminClient
    .from("stories")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .gte("created_at", startOfToday);

  return count ?? 0;
}

// بررسی «آیا این کاربر اجازه‌ی ثبت یک استوری تازه را دارد؟» — کاربر VIP همیشه مجاز است؛ کاربر
// معمولی فقط تا سقف FREE_DAILY_STORY_LIMIT در همان روز (به وقت کابل).
export async function canUserPostStoryToday(params: {
  userId: string;
  isVip: boolean;
}): Promise<{ allowed: boolean; currentCount: number }> {
  if (params.isVip) return { allowed: true, currentCount: 0 };

  const currentCount = await getUserDailyStoryCount(params.userId);
  return { allowed: currentCount < FREE_DAILY_STORY_LIMIT, currentCount };
}