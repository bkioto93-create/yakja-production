// مسیر فایل: src/app/[lang]/chat/actions.ts
// فاز ۱۲ — اکشن‌های چت: شروع/ادامه‌ی گفتگو، ارسال پیام متنی، آپلود و ارسال پیام صوتی.
// دقیقاً هم‌الگو با src/app/[lang]/vip/actions.ts: تمام اعتبارسنجی و نوشتن سمت سرور با
// supabaseAdminClient انجام می‌شود (auth.uid() در این پروژه همیشه null است، بند ۸.۴ سند راهبردی).
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { isUserVip } from "@/lib/vip/vipStatus";
import { canUserStartNewConversation } from "@/lib/chat/chatLimits";
import type { ChatContextType } from "@/lib/chat/chatQueries";

const VOICE_BUCKET = "chat-voice-messages";
const MAX_TEXT_LENGTH = 2000;
const MAX_VOICE_SECONDS = 120; // ۲ دقیقه سقف هر پیام صوتی — کافی برای یک پیام کوتاه، نه فایل حجیم

type ActionResult<T = object> =
  | ({ success: true } & T)
  | { success: false; error: string };

// شروع یک گفتگوی تازه، یا برگرداندن همان گفتگوی موجود اگر آغازکننده از قبل با همین context یک
// گفتگو داشته — طبق Unique Constraint دیتابیس (context_type, context_id, initiator_id)، این
// همیشه idempotent است: هرگز دو ردیف تکراری برای یک جفت «آغازکننده + آگهی» ساخته نمی‌شود.
//
// سقف روزانه فقط وقتی بررسی می‌شود که واقعاً یک گفتگوی *تازه* در حال ساخته‌شدن است — نه هر بار که
// کاربر روی دکمه‌ی «چت» یک آگهی که قبلاً با آن گفتگو داشته کلیک می‌کند.
export async function startConversationAction(
  contextType: ChatContextType,
  contextId: string,
  ownerId: string
): Promise<ActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (user.id === ownerId) {
    return { success: false, error: "cannotChatWithSelf" };
  }

  const { data: existing } = await supabaseAdminClient
    .from("conversations")
    .select("id")
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .eq("initiator_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: true, conversationId: existing.id as string };
  }

  const isVip = isUserVip(user.vipExpiresAt);
  const { allowed } = await canUserStartNewConversation({ userId: user.id, isVip });
  if (!allowed) {
    return { success: false, error: "dailyLimitReached" };
  }

  const { data: created, error } = await supabaseAdminClient
    .from("conversations")
    .insert({
      context_type: contextType,
      context_id: contextId,
      initiator_id: user.id,
      owner_id: ownerId,
    })
    .select("id")
    .maybeSingle();

  // خطای ۲۳۵۰۵ (نقض Unique Constraint) یعنی هم‌زمان (Race Condition) یک درخواست دیگر همین
  // گفتگو را ساخته — در این حالت به‌جای خطا، همان ردیف موجود را دوباره می‌خوانیم و برمی‌گردانیم.
  if (error?.code === "23505") {
    const { data: raceWinner } = await supabaseAdminClient
      .from("conversations")
      .select("id")
      .eq("context_type", contextType)
      .eq("context_id", contextId)
      .eq("initiator_id", user.id)
      .maybeSingle();
    if (raceWinner) return { success: true, conversationId: raceWinner.id as string };
  }

  if (error || !created) return { success: false, error: "dbError" };

  return { success: true, conversationId: created.id as string };
}

async function assertMembership(conversationId: string, userId: string) {
  const { data } = await supabaseAdminClient
    .from("conversations")
    .select("id, initiator_id, owner_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!data) return false;
  return data.initiator_id === userId || data.owner_id === userId;
}

export async function sendTextMessageAction(
  lang: string,
  conversationId: string,
  content: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "emptyMessage" };
  if (trimmed.length > MAX_TEXT_LENGTH) return { success: false, error: "messageTooLong" };

  const isMember = await assertMembership(conversationId, user.id);
  if (!isMember) return { success: false, error: "unauthorized" };

  const { error: insertError } = await supabaseAdminClient.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    message_type: "text",
    content: trimmed,
  });

  if (insertError) return { success: false, error: "dbError" };

  await supabaseAdminClient
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/${lang}/chat/${conversationId}`);
  return { success: true };
}

export type SignedUploadSlot = { path: string; token: string };

// صدور آدرس آپلود امضاشده برای یک پیام صوتی — دقیقاً هم‌الگو با createSignedVideoUploadSlotAction
// در ماژول‌های دیگر، اما بدون هیچ گیت VIP (ویس بخشی از قابلیت پایه‌ی چت است، نه امتیاز VIP).
export async function createVoiceUploadSlotAction(
  conversationId: string
): Promise<{ success: true; slot: SignedUploadSlot } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const isMember = await assertMembership(conversationId, user.id);
  if (!isMember) return { success: false, error: "unauthorized" };

  const path = `${conversationId}/${user.id}_${Date.now()}.webm`;
  const { data, error } = await supabaseAdminClient.storage
    .from(VOICE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

export async function sendVoiceMessageAction(
  lang: string,
  conversationId: string,
  voicePath: string,
  durationSeconds: number
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const isMember = await assertMembership(conversationId, user.id);
  if (!isMember) return { success: false, error: "unauthorized" };

  // دفاع در عمق: مسیر فایل باید دقیقاً همان قرارداد createVoiceUploadSlotAction را داشته باشد.
  if (!voicePath.startsWith(`${conversationId}/${user.id}_`)) {
    return { success: false, error: "invalidVoiceData" };
  }

  const safeDuration = Number.isFinite(durationSeconds)
    ? Math.min(Math.max(0, Math.round(durationSeconds)), MAX_VOICE_SECONDS)
    : null;

  const { error: insertError } = await supabaseAdminClient.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    message_type: "voice",
    voice_path: voicePath,
    voice_duration_seconds: safeDuration,
  });

  if (insertError) {
    try {
      await supabaseAdminClient.storage.from(VOICE_BUCKET).remove([voicePath]);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false, error: "dbError" };
  }

  await supabaseAdminClient
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/${lang}/chat/${conversationId}`);
  return { success: true };
}