// مسیر فایل: src/app/api/mobile/v1/push/unregister/route.ts
// قابلیت Push Notification — حذفِ توکنِ یک دستگاه، معمولاً هنگامِ خروج از حساب. صفر منطق تجاری
// تازه — همان unregisterPushToken موجود صدا زده می‌شود.
//
// **بدون نیاز به احراز هویت عمداً:** این عملِ حذف فقط با خودِ رشته‌ی توکن کار می‌کند (نه بر پایه‌ی
// شناسه‌ی کاربر)، و توکن یک رشته‌ی طولانی و عملاً غیرقابل‌حدس‌زدن است — کاربری که این توکنِ
// خاص را در اختیار ندارد، هیچ‌وقت نمی‌تواند آن را حذف کند. این باعث می‌شود خروج از حساب حتی اگر
// نشستِ کاربر همان لحظه به هر دلیلی نامعتبر شده باشد، هنوز بتواند توکنِ محلی را پاک کند.
//
// بدنه‌ی درخواست: { expoPushToken: string }
import "server-only";
import { NextResponse } from "next/server";
import { unregisterPushToken } from "@/lib/push/pushTokens";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.expoPushToken !== "string") {
    return NextResponse.json({ success: false, error: "invalidToken" }, { status: 400 });
  }

  const success = await unregisterPushToken(body.expoPushToken);
  return NextResponse.json({ success });
}