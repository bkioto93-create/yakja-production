// مسیر فایل: src/lib/push/sendPushNotification.ts
// قابلیت Push Notification — ارسالِ واقعیِ اعلان به دستگاه(های)ِ یک کاربر، از طریق سرویسِ عمومیِ
// Push خودِ Expo (بدون نیاز به هیچ گواهی/کلیدِ جداگانه‌ی iOS/Android — دقیقاً همان چیزی که
// اپلیکیشنِ ساخته‌شده با Expo Managed Workflow را از پیکربندیِ پیچیده‌ی APNs/FCM بی‌نیاز می‌کند).
//
// این فایل عمداً «بی‌سروصدا» است: اگر ارسال با خطا مواجه شود (کاربر توکنی ندارد، Expo پاسخ ندهد،
// و ...)، هرگز چیزی throw نمی‌کند — چون Push notification همیشه باید «بهترین تلاش» (best-effort)
// باشد؛ نباید هرگز باعثِ شکستِ خودِ عملِ اصلی (مثلاً ارسالِ پیامِ چت) شود.
import "server-only";
import { getUserPushTokens, removeInvalidPushTokens } from "./pushTokens";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
};

type ExpoPushTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

/**
 * ارسالِ یک اعلانِ یکسان به همه‌ی دستگاه‌های ثبت‌شده‌ی یک کاربر. اگر کاربر هیچ توکنی نداشته
 * باشد (هنوز اپِ موبایل نصب نکرده، یا اجازه‌ی اعلان نداده)، بی‌صدا هیچ کاری نمی‌کند.
 */
export async function sendPushNotification(
  userId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  try {
    const tokens = await getUserPushTokens(userId);
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: "default",
    }));

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) return;

    const result: { data?: ExpoPushTicket[] } = await res.json();
    const tickets = result.data ?? [];

    // هر توکنی که Expo صریحاً «این دستگاه دیگر ثبت‌شده نیست» اعلام کند، از دیتابیس پاک می‌شود —
    // خودپاک‌سازیِ توکن‌های مرده، بدون نیاز به یک Cron جداگانه.
    const deadTokens: string[] = [];
    tickets.forEach((ticket, i) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        deadTokens.push(tokens[i]);
      }
    });
    await removeInvalidPushTokens(deadTokens);
  } catch {
    // best-effort — هرگز نباید باعثِ شکستِ فراخوانِ اصلی (مثلاً sendTextMessageAction) شود.
  }
}