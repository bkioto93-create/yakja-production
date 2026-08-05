// مسیر فایل: src/lib/push/pushTokens.ts
// قابلیت Push Notification — لایه‌ی خواندن/نوشتنِ جدولِ push_tokens (رجوع کنید به مهاجرتِ
// 24_push_notifications.sql برای طراحی کاملِ جدول و دلیلِ نبودِ RLS عمومی).
//
// "server-only" — دقیقاً هم‌الگو با بقیه‌ی فایل‌های lib این پروژه که با supabaseAdminClient کار
// می‌کنند؛ این فایل هرگز نباید از یک کامپوننتِ کلاینت import شود.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type PushPlatform = "ios" | "android";

/**
 * ثبت/به‌روزرسانیِ توکنِ یک دستگاه. Idempotent — به‌جای INSERT ساده، از upsert روی محدودیتِ
 * یکتاییِ (user_id, expo_push_token) استفاده می‌شود؛ اگر همان توکن قبلاً برای همین کاربر ثبت
 * شده بود (مثلاً اپ دوباره باز شد)، فقط last_used_at به‌روز می‌شود، نه یک ردیفِ تکراری.
 */
export async function registerPushToken(
  userId: string,
  expoPushToken: string,
  platform: PushPlatform
): Promise<boolean> {
  const { error } = await supabaseAdminClient.from("push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,expo_push_token" }
  );

  return !error;
}

/**
 * حذفِ توکنِ یک دستگاهِ خاص — هنگامِ خروج از حساب (تا کاربری که از حساب خارج شده، دیگر
 * اعلانِ حسابِ خودش را دریافت نکند، حتی اگر دستگاه فیزیکی همچنان دستِ کاربرِ اول باشد).
 */
export async function unregisterPushToken(expoPushToken: string): Promise<boolean> {
  const { error } = await supabaseAdminClient
    .from("push_tokens")
    .delete()
    .eq("expo_push_token", expoPushToken);

  return !error;
}

export async function getUserPushTokens(userId: string): Promise<string[]> {
  const { data } = await supabaseAdminClient
    .from("push_tokens")
    .select("expo_push_token")
    .eq("user_id", userId);

  return (data ?? []).map((row) => row.expo_push_token as string);
}

/**
 * پاک‌سازیِ توکن‌های نامعتبر — وقتی Expo برای یک توکنِ خاص خطای DeviceNotRegistered برمی‌گرداند
 * (یعنی اپ از آن دستگاه پاک شده)، آن توکن دیگر هیچ‌وقت معتبر نمی‌شود؛ نگه‌داشتنش فقط باعثِ
 * درخواست‌های بی‌فایده‌ی بعدی به Expo می‌شود.
 */
export async function removeInvalidPushTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await supabaseAdminClient.from("push_tokens").delete().in("expo_push_token", tokens);
}