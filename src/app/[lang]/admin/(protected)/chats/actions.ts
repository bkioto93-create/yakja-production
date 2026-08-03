// مسیر فایل: src/app/[lang]/admin/(protected)/chats/actions.ts
// فاز ۱۳ — اکشن‌های بخش «چت‌ها» پنل مدیریت: تایید یا رد یک درخواست چت پشتیبانی. دقیقاً هم‌الگو
// با src/app/[lang]/admin/(protected)/vip/actions.ts (approveVipRequestAction/rejectVipRequestAction):
// هر دو اکشن پس از موفقیت در admin_logs ثبت می‌شوند (logAdminAction).
//
// نکته‌ی طراحی مهم: تایید («approve») هم از حالت 'pending' و هم از حالت 'rejected' مجاز است —
// یعنی مدیر می‌تواند نظرش را عوض کند و درخواستی را که قبلاً رد کرده، بعداً دوباره باز کند. رد
// («decline») فقط از حالت 'pending' مجاز است (رد یک گفتگوی از قبل فعال، بی‌معناست و مسیر جداگانه
// می‌خواهد که خارج از دامنه‌ی همین قابلیت است).
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/adminLogs";
import { ADMIN_SUPPORT_CONTEXT_TYPE } from "@/lib/chat/adminSupportChat";

type ActionResult = { success: true } | { success: false; error: string };

export async function approveAdminChatRequestAction(
  lang: string,
  conversationId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { data: conversation, error: fetchError } = await supabaseAdminClient
    .from("conversations")
    .select("id, context_type, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (fetchError || !conversation) return { success: false, error: "notFound" };
  if (conversation.context_type !== ADMIN_SUPPORT_CONTEXT_TYPE) return { success: false, error: "notFound" };
  if (conversation.status === "active") return { success: false, error: "alreadyActive" };

  const { error } = await supabaseAdminClient
    .from("conversations")
    .update({ status: "active", responded_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "conversation",
    targetId: conversationId,
    action: "approved_chat_request",
  });

  revalidatePath(`/${lang}/admin/chats`);

  return { success: true };
}

export async function declineAdminChatRequestAction(
  lang: string,
  conversationId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { data: conversation, error: fetchError } = await supabaseAdminClient
    .from("conversations")
    .select("id, context_type, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (fetchError || !conversation) return { success: false, error: "notFound" };
  if (conversation.context_type !== ADMIN_SUPPORT_CONTEXT_TYPE) return { success: false, error: "notFound" };
  if (conversation.status !== "pending") return { success: false, error: "alreadyReviewed" };

  const { error } = await supabaseAdminClient
    .from("conversations")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "conversation",
    targetId: conversationId,
    action: "declined_chat_request",
  });

  revalidatePath(`/${lang}/admin/chats`);

  return { success: true };
}