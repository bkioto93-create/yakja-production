// مسیر فایل: src/app/api/mobile/v1/users/[id]/route.ts
// فاز M06 موبایل، تسک ۳ — نسخه‌ی HTTP-محورِ همان پروفایل عمومی کاربر که وب با
// getPublicUserProfile (src/lib/users/publicProfileQueries.ts، تکمیل گذشته‌نگر تسک ۳ فاز ۰۶) از
// قبل دارد و برای صفحه‌ی وب تست شده.
//
// دقیقاً هم‌الگو با src/app/api/mobile/v1/marketplace/my-listings/route.ts (فاز M02 موبایل، تسک
// ۷): یک Route عمومیِ صرفاً-خواندنی، بدون بسته‌بندی success/error — چون تنها حالت خطا همان
// «کاربر پیدا نشد» است که خودش با profile: null نمایش داده می‌شود، نه یک کد خطای جداگانه.
//
// **بدون نیاز به احراز هویت** — برخلاف بیشتر Route های پل موبایل، این یکی حتی برای بازدیدکننده‌ی
// مهمان هم باید کار کند (دقیقاً مثل صفحه‌ی وب که viewer می‌تواند null باشد)؛ تشخیص «آیا این
// پروفایل خودِ من است؟» (برای پنهان‌کردن دکمه‌ی گزارش تخلف روی پروفایل خود) کاملاً سمت موبایل و
// از روی useAuth().user محلی انجام می‌شود، بدون نیاز به فرستادن توکن به این Route.
//
// چون جدول users هیچ Policy عمومی/anon ندارد (درست مثل reports)، getPublicUserProfile خودش از
// supabaseAdminClient استفاده می‌کند؛ تنها ستون‌های امن (id، name، created_at) خوانده می‌شوند —
// phone_number/role هرگز در پاسخ این Route نیستند (بند حریم خصوصی سند راهبردی).
//
// خروجی: { profile: PublicUserProfile | null }  (null یعنی کاربر وجود ندارد یا مسدود شده است)
import "server-only";
import { NextResponse } from "next/server";
import { getPublicUserProfile } from "@/lib/users/publicProfileQueries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicUserProfile(id);
  return NextResponse.json({ profile });
}