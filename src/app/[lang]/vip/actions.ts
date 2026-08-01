// مسیر فایل: src/app/[lang]/vip/actions.ts
// فاز ۱۱ — Server Action ثبت «درخواست عضویت VIP» (بند ۲، مرحله‌ی ۴ پرامپت). دقیقاً هم‌الگو با
// createReportAction (src/app/[lang]/report/new/actions.ts): تمام اعتبارسنجی/نوشتن سمت سرور با
// supabaseAdminClient انجام می‌شود، چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null
// است (بند ۸.۴ سند راهبردی).
//
// تصمیم پذیرفته‌شده برای سوال باز ۳ پرامپت: وقتی درخواست قبلی کاربر رد شده باشد، امکان ثبت
// درخواست جدید فوری و بدون هیچ محدودیت زمانی وجود دارد (چون دلیل رد معمولاً «پول واریز نشده»
// است). این اکشن فقط از ثبت درخواست تازه جلوگیری می‌کند اگر کاربر همین حالا یک درخواست
// «در انتظار بررسی» باز داشته باشد — تا صف ادمین با درخواست‌های تکراری از یک کاربر شلوغ نشود.
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";

const VALID_PAYMENT_METHODS = ["bank", "exchange"] as const;
type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

type ActionResult = { success: true } | { success: false; error: string };

export async function createVipRequestAction(
  lang: string,
  paymentMethod: PaymentMethod,
  note: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return { success: false, error: "invalidPaymentMethod" };
  }

  // جلوگیری از درخواست تکراری وقتی از قبل یک درخواست «در انتظار بررسی» باز دارد.
  const { data: pendingExisting } = await supabaseAdminClient
    .from("vip_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingExisting) {
    return { success: false, error: "alreadyPending" };
  }

  const trimmedNote = note.trim();

  const { error } = await supabaseAdminClient.from("vip_requests").insert({
    user_id: user.id,
    payment_method: paymentMethod,
    note: trimmedNote || null,
    status: "pending",
  });

  if (error) return { success: false, error: "dbError" };

  revalidatePath(`/${lang}/vip`);
  revalidatePath(`/${lang}/profile`);

  return { success: true };
}