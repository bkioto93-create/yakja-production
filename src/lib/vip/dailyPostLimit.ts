// مسیر فایل: src/lib/vip/dailyPostLimit.ts
// فاز ۱۱ — امتیاز شماره‌ی ۲ عضویت VIP: «ثبت بیش از ۲ آگهی در روز فقط برای VIP».
//
// طبق بند ۱ (YAKJA_VIP_MEMBERSHIP_PROMPT.md): این سقف فقط شامل «آگهی» به معنای دقیق کلمه است —
// یعنی جدول listings (ماژول کالا) و جدول real_estate (ماژول املاک). پروفایل راننده/متخصص
// خدماتی مشمول این سقف نیست (یک‌بارمصرف است، نه آگهی تکرارشونده‌ی روزانه).
//
// تصمیم پذیرفته‌شده برای سوال باز ۱ همان پرامپت: سقف روزانه، مجموع هر دو ماژول (کالا+املاک) با
// هم حساب می‌شود، نه جداگانه — چون از دید کاربر هر دو «ثبت آگهی» هستند. طبق توصیه‌ی صریح همان
// بند، این منطق در یک تابع مستقل نگه داشته شده تا اگر بعداً نظر کارفرما عوض شد، تغییرش یک‌جا و
// ساده باشد (فقط همین فایل).
//
// منطقه‌ی زمانی: طبق تاکید صریح پرامپت، محاسبه‌ی «مرز روز» باید Asia/Kabul (UTC+4:30) باشد، نه
// UTC یا زمان سرور — افغانستان هیچ‌وقت ساعت تابستانی (DST) نداشته، پس افست ثابت +4:30 همیشه
// درست است؛ نیازی به کتابخانه‌ی timezone سنگین (مثل date-fns-tz) نیست.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export const FREE_DAILY_POST_LIMIT = 2;

const KABUL_OFFSET_MS = 4.5 * 60 * 60 * 1000; // UTC+4:30، بدون DST

// لحظه‌ی (به وقت UTC) شروع «امروز» به وقت کابل — برای استفاده در فیلتر created_at >= ...
export function getStartOfTodayInKabulUtc(now: Date = new Date()): Date {
  const kabulNow = new Date(now.getTime() + KABUL_OFFSET_MS);
  const y = kabulNow.getUTCFullYear();
  const m = kabulNow.getUTCMonth();
  const d = kabulNow.getUTCDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - KABUL_OFFSET_MS);
}

// شمارش «آگهی‌های ثبت‌شده‌ی امروز» یک کاربر — مجموع listings + real_estate، بدون در نظر گرفتن
// وضعیت (pending/approved/deleted)، چون سقف روی «تلاش برای ثبت»، نه روی «تایید نهایی» اعمال
// می‌شود — دقیقاً هم‌رویه با این‌که کاربر بعد از ثبت هم نباید بی‌نهایت آگهیِ در-انتظار بسازد.
export async function getUserDailyPostCount(userId: string): Promise<number> {
  const startOfToday = getStartOfTodayInKabulUtc().toISOString();

  const [listingsResult, realEstateResult] = await Promise.all([
    supabaseAdminClient
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .gte("created_at", startOfToday),
    supabaseAdminClient
      .from("real_estate")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .gte("created_at", startOfToday),
  ]);

  return (listingsResult.count ?? 0) + (realEstateResult.count ?? 0);
}

// بررسی «آیا این کاربر اجازه‌ی ثبت یک آگهی تازه را دارد؟» — کاربر VIP همیشه مجاز است؛ کاربر
// معمولی فقط تا سقف FREE_DAILY_POST_LIMIT در همان روز (به وقت کابل).
export async function canUserPostToday(params: {
  userId: string;
  isVip: boolean;
}): Promise<{ allowed: boolean; currentCount: number }> {
  if (params.isVip) return { allowed: true, currentCount: 0 };

  const currentCount = await getUserDailyPostCount(params.userId);
  return { allowed: currentCount < FREE_DAILY_POST_LIMIT, currentCount };
}