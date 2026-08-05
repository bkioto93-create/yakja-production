// مسیر فایل: src/app/api/mobile/v1/push/register/route.ts
// قابلیت Push Notification — ثبت/به‌روزرسانیِ توکنِ Push یک دستگاه. صفر منطق تجاری تازه —
// همان registerPushToken موجود (src/lib/push/pushTokens.ts) صدا زده می‌شود.
//
// بدنه‌ی درخواست: { expoPushToken: string, platform: "ios" | "android" }
// خروجی: { success: boolean }
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { registerPushToken } from "@/lib/push/pushTokens";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.expoPushToken !== "string" ||
    (body.platform !== "ios" && body.platform !== "android")
  ) {
    return NextResponse.json({ success: false, error: "invalidToken" }, { status: 400 });
  }

  const success = await registerPushToken(user.id, body.expoPushToken, body.platform);
  return NextResponse.json({ success });
}