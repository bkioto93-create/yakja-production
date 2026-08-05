// مسیر فایل: src/app/api/mobile/v1/vip/request/route.ts
// قابلیت VIP (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ همان createVipRequestAction موجود
// (src/app/[lang]/vip/actions.ts). صفر منطق تجاری تازه — همان اکشنِ موجود عیناً فراخوانی
// می‌شود؛ همان اکشن هم پیش‌تر برای وب طراحی شده بود که آرگومان اولش «lang» است (فقط برای
// revalidatePath مسیرهای وب استفاده می‌شود) — برای موبایل یک مقدار ثابتِ بی‌اثر ("fa") پاس داده
// می‌شود، چون هیچ مسیر Next.jsای برای revalidate کردن در اپ موبایل وجود ندارد.
//
// بدنه‌ی درخواست: { paymentMethod: "bank" | "exchange", note?: string }
// خروجی موفق: { success: true }
// خروجی ناموفق: { success: false, error } — error یکی از: unauthenticated،
// invalidPaymentMethod، alreadyPending، dbError.
import "server-only";
import { NextResponse } from "next/server";
import { createVipRequestAction } from "@/app/[lang]/vip/actions";

const STATUS_BY_ERROR: Record<string, number> = {
  unauthenticated: 401,
  invalidPaymentMethod: 400,
  alreadyPending: 409,
  dbError: 500,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || (body.paymentMethod !== "bank" && body.paymentMethod !== "exchange")) {
    return NextResponse.json({ success: false, error: "invalidPaymentMethod" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note : "";
  // آرگومان اول (lang) فقط برای revalidatePath مسیرهای وب استفاده می‌شود — بی‌اثر برای موبایل.
  const result = await createVipRequestAction("fa", body.paymentMethod, note);

  if (!result.success) {
    const status = STATUS_BY_ERROR[result.error] ?? 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}