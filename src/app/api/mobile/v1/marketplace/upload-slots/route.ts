// مسیر فایل: src/app/api/mobile/v1/marketplace/upload-slots/route.ts
// فاز M02 موبایل، تسک ۵ (نیمه‌ی اول) — نسخه‌ی HTTP-محورِ همان مکانیزم Signed Upload URL که وب
// با createSignedUploadSlotsAction (src/app/[lang]/listings/new/actions.ts، تسک ۴/۵ فاز ۰۲)
// از قبل دارد و تست شده.
//
// طبق همان اصل بنیادین Route های فاز M01 (request-otp/verify-otp/logout/profile): این فایل هیچ
// منطق تجاری تازه‌ای نمی‌نویسد — فقط createSignedUploadSlotsAction موجود را عیناً صدا می‌زند و
// خروجی‌اش را به JSON تبدیل می‌کند. getCurrentUser() داخل خودِ آن اکشن، هدر
// Authorization: Bearer <token> را می‌خواند (چون از فاز M01 در src/lib/auth/session.ts این
// قابلیت اضافه شده) — پس این Route حتی نیازی به خواندن دستیِ کاربر ندارد.
//
// ⚠️ اصلاح نسبت به نسخه‌ی حدسی قبلی: قبلاً این فایل با دو کمکی فرضی (getMobileUser/supabaseAdmin)
// نوشته شده بود چون خودِ actions.ts در دسترس نبود. حالا که کد واقعی دیده شد، معلوم شد
// createSignedUploadSlotsAction از قبل همین دقیق کار (createSignedUploadUrl با قرارداد مسیر
// {owner_id}/{filename}) را انجام می‌دهد — پس این Route فقط یک لایه‌ی نازک HTTP روی آن است،
// دقیقاً هم‌الگو با چهار Route فاز M01.
//
// بدنه‌ی درخواست: { "count": number }  (بین ۱ تا ۵)
// خروجی موفق: { success: true, slots: [{ path, token }, ...] }
// خروجی ناموفق: { success: false, error }  — کدهای ممکن: unauthenticated (۴۰۱)،
//   invalidImageCount (۴۰۰)، uploadFailed (۵۰۰).
import "server-only";
import { NextResponse } from "next/server";
import { createSignedUploadSlotsAction } from "@/app/[lang]/listings/new/actions";

const ERROR_STATUS: Record<string, number> = {
  unauthenticated: 401,
  invalidImageCount: 400,
  uploadFailed: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalidImageCount" }, { status: 400 });
  }

  const count =
    typeof body === "object" && body !== null && typeof (body as { count?: unknown }).count === "number"
      ? (body as { count: number }).count
      : NaN;

  const result = await createSignedUploadSlotsAction(count);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: ERROR_STATUS[result.error] ?? 500 }
    );
  }

  return NextResponse.json({ success: true, slots: result.slots });
}