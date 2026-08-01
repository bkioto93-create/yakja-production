// مسیر فایل: src/lib/vip/vipQueries.ts
// فاز ۱۱ — لایه‌ی خواندن «آخرین درخواست VIP خودِ کاربر» — برای نمایش نشان وضعیت در پروفایل
// (خالی/در انتظار/تاییدشده/ردشده)، طبق بند ۲ پرامپت (مرحله‌ی ۵ جریان خرید).
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type VipRequestStatus = "pending" | "approved" | "rejected";

export type MyVipRequest = {
  id: string;
  paymentMethod: "bank" | "exchange";
  status: VipRequestStatus;
  requestedAt: string;
  rejectionReason: string | null;
};

// آخرین درخواست ثبت‌شده‌ی کاربر (اگر اصلاً درخواستی نداده باشد، null برمی‌گردد — یعنی هنوز هیچ
// نشان وضعیتی در پروفایلش دیده نمی‌شود).
export async function getMyLatestVipRequest(userId: string): Promise<MyVipRequest | null> {
  const { data, error } = await supabaseAdminClient
    .from("vip_requests")
    .select("id, payment_method, status, requested_at, rejection_reason")
    .eq("user_id", userId)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    paymentMethod: data.payment_method as "bank" | "exchange",
    status: data.status as VipRequestStatus,
    requestedAt: data.requested_at as string,
    rejectionReason: data.rejection_reason as string | null,
  };
}