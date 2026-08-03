// مسیر فایل: src/lib/admin/adminChatQueries.ts
// فاز ۱۳ — لایه‌ی خواندنِ بخش «چت‌ها»ی پنل مدیریت: صفِ درخواست‌های چت با پشتیبانی، به‌تفکیک
// وضعیت (در انتظار/فعال/ردشده) + شمارش «در انتظار» برای نشان روی کارت داشبورد.
//
// دقیقاً هم‌الگو با src/lib/vip/adminVipQueries.ts: چون هیچ Foreign Key واقعی/Join مستقیمی بین
// conversations و users برای supabase-js تعریف نشده، اطلاعات کاربر (نام/شماره) با یک کوئری
// batched دوم (`.in("id", ...)`) خوانده و در حافظه ترکیب می‌شود. آخرین پیامِ هر گفتگو هم به همان
// شکلِ getMyConversations (src/lib/chat/chatQueries.ts) با یک کوئری دسته‌ای دوم خوانده می‌شود.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { ADMIN_SUPPORT_CONTEXT_TYPE } from "@/lib/chat/adminSupportChat";
import type { ConversationStatus } from "@/lib/chat/chatQueries";

export type AdminChatRequestRow = {
  id: string;
  userId: string;
  userName: string | null;
  userPhone: string | null;
  status: ConversationStatus;
  requestedAt: string;
  respondedAt: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
};

export const ADMIN_CHATS_PAGE_SIZE = 20;

export async function getAdminChatRequestsPage(params: {
  status: ConversationStatus;
  page?: number;
}): Promise<{ items: AdminChatRequestRow[]; totalCount: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * ADMIN_CHATS_PAGE_SIZE;
  const to = from + ADMIN_CHATS_PAGE_SIZE - 1;

  const { data, error, count } = await supabaseAdminClient
    .from("conversations")
    .select("id, initiator_id, status, requested_at, responded_at, last_message_at", {
      count: "exact",
    })
    .eq("context_type", ADMIN_SUPPORT_CONTEXT_TYPE)
    .eq("status", params.status)
    // در انتظار: قدیمی‌ترین درخواست اول (تا کسی که زودتر درخواست داده زودتر هم دیده شود) —
    // دقیقاً هم‌رویه با getVipRequestsPage. فعال/ردشده: تازه‌ترین اول.
    .order("requested_at", { ascending: params.status === "pending" })
    .range(from, to);

  if (error || !data) return { items: [], totalCount: 0, pageSize: ADMIN_CHATS_PAGE_SIZE };

  const userIds = Array.from(new Set(data.map((row) => row.initiator_id as string)));
  const conversationIds = data.map((row) => row.id as string);

  const [{ data: users }, { data: lastMessages }] = await Promise.all([
    userIds.length > 0
      ? supabaseAdminClient.from("users").select("id, name, phone_number").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null; phone_number: string | null }[] }),
    conversationIds.length > 0
      ? supabaseAdminClient
          .from("chat_messages")
          .select("conversation_id, message_type, content, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { conversation_id: string; message_type: string; content: string | null; created_at: string }[] }),
  ]);

  const usersMap = new Map((users ?? []).map((u) => [u.id as string, u]));
  const lastMessageMap = new Map<string, { preview: string; at: string }>();
  for (const m of lastMessages ?? []) {
    const key = m.conversation_id as string;
    if (!lastMessageMap.has(key)) {
      lastMessageMap.set(key, {
        preview: m.message_type === "voice" ? "🎙" : ((m.content as string | null) ?? ""),
        at: m.created_at as string,
      });
    }
  }

  const items: AdminChatRequestRow[] = data.map((row) => {
    const user = usersMap.get(row.initiator_id as string);
    const lastMessage = lastMessageMap.get(row.id as string);
    return {
      id: row.id as string,
      userId: row.initiator_id as string,
      userName: (user?.name as string | null) ?? null,
      userPhone: (user?.phone_number as string | null) ?? null,
      status: row.status as ConversationStatus,
      requestedAt: row.requested_at as string,
      respondedAt: row.responded_at as string | null,
      lastMessagePreview: lastMessage?.preview ?? null,
      lastMessageAt: lastMessage?.at ?? null,
    };
  });

  return { items, totalCount: count ?? 0, pageSize: ADMIN_CHATS_PAGE_SIZE };
}

// شمارش «درخواست‌های در انتظار» — برای نشان روی کارت داشبورد ادمین، دقیقاً هم‌الگو با
// getPendingReportsCount (src/lib/reports/adminReportQueries.ts).
export async function getPendingAdminChatRequestsCount(): Promise<number> {
  const { count } = await supabaseAdminClient
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("context_type", ADMIN_SUPPORT_CONTEXT_TYPE)
    .eq("status", "pending");

  return count ?? 0;
}