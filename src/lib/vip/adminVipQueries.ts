// مسیر فایل: src/lib/vip/adminVipQueries.ts
// فاز ۱۱ — لایه‌ی خواندنِ بخش «اشتراک VIP» پنل مدیریت: فهرست درخواست‌های در انتظار/بررسی‌شده +
// فهرست «کاربران VIP فعال» (بند ۸ پرامپت، مورد ۴ — پیشنهادی، نه الزامی؛ همین‌جا اضافه شد).
//
// دقیقاً هم‌الگو با src/lib/reports/adminReportQueries.ts: چون هیچ Foreign Key واقعی/Join
// مستقیمی بین vip_requests و users برای supabase-js تعریف نشده، اطلاعات کاربر (نام/شماره) با یک
// کوئری batched دوم (`.in("id", ...)`) خوانده و در حافظه ترکیب می‌شود.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { VipRequestStatus } from "./vipQueries";

export type AdminVipRequestRow = {
  id: string;
  userId: string;
  userName: string | null;
  userPhone: string | null;
  paymentMethod: "bank" | "exchange";
  status: VipRequestStatus;
  note: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export const ADMIN_VIP_REQUESTS_PAGE_SIZE = 20;

export async function getVipRequestsPage(params: {
  status: VipRequestStatus;
  page?: number;
}): Promise<{ items: AdminVipRequestRow[]; totalCount: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * ADMIN_VIP_REQUESTS_PAGE_SIZE;
  const to = from + ADMIN_VIP_REQUESTS_PAGE_SIZE - 1;

  const { data, error, count } = await supabaseAdminClient
    .from("vip_requests")
    .select("id, user_id, payment_method, status, note, requested_at, reviewed_at, rejection_reason", {
      count: "exact",
    })
    .eq("status", params.status)
    .order("requested_at", { ascending: params.status === "pending" })
    .range(from, to);

  if (error || !data) return { items: [], totalCount: 0, pageSize: ADMIN_VIP_REQUESTS_PAGE_SIZE };

  const userIds = Array.from(new Set(data.map((row) => row.user_id as string)));
  const usersMap = new Map<string, { name: string | null; phone: string | null }>();

  if (userIds.length > 0) {
    const { data: users } = await supabaseAdminClient
      .from("users")
      .select("id, name, phone_number")
      .in("id", userIds);

    for (const u of users ?? []) {
      usersMap.set(u.id as string, { name: u.name as string | null, phone: u.phone_number as string | null });
    }
  }

  const items: AdminVipRequestRow[] = data.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    userName: usersMap.get(row.user_id as string)?.name ?? null,
    userPhone: usersMap.get(row.user_id as string)?.phone ?? null,
    paymentMethod: row.payment_method as "bank" | "exchange",
    status: row.status as VipRequestStatus,
    note: row.note as string | null,
    requestedAt: row.requested_at as string,
    reviewedAt: row.reviewed_at as string | null,
    rejectionReason: row.rejection_reason as string | null,
  }));

  return { items, totalCount: count ?? 0, pageSize: ADMIN_VIP_REQUESTS_PAGE_SIZE };
}

export type ActiveVipUserRow = {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  vipExpiresAt: string;
};

// فهرست «کاربران VIP فعال» — پیشنهادی طبق بند ۸.۴ پرامپت، برای دید کلی کارفرما.
export async function getActiveVipUsers(): Promise<ActiveVipUserRow[]> {
  const { data, error } = await supabaseAdminClient
    .from("users")
    .select("id, name, phone_number, vip_expires_at")
    .gt("vip_expires_at", new Date().toISOString())
    .order("vip_expires_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string | null,
    phoneNumber: row.phone_number as string | null,
    vipExpiresAt: row.vip_expires_at as string,
  }));
}