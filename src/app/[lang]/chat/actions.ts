// مسیر فایل: src/app/[lang]/chat/actions.ts
// فاز ۱۲ — اکشن‌های چت: شروع/ادامه‌ی گفتگو، ارسال پیام متنی، آپلود و ارسال پیام صوتی.
// دقیقاً هم‌الگو با src/app/[lang]/vip/actions.ts: تمام اعتبارسنجی و نوشتن سمت سرور با
// supabaseAdminClient انجام می‌شود (auth.uid() در این پروژه همیشه null است، بند ۸.۴ سند راهبردی).
//
// **به‌روزرسانی فاز ۱۳ (چت با مدیر/پشتیبانی):**
// ۱) اکشن تازه‌ی startAdminSupportConversationAction — دقیقاً هم‌روح با startConversationAction
//    (idempotent، بدون تکرار ردیف)، با این تفاوت‌ها: (الف) owner/context همیشه همان حساب ادمین
//    پشتیبانی است، نه یک آگهی/پروفایل که کاربر انتخاب کرده، (ب) هرگز مشمول سقف روزانه‌ی گفتگوی
//    تازه نیست (تماس با پشتیبانی خودِ پلتفرم، نه گفتگو با یک آگهی/پروفایل دیگر)، (ج) گفتگوی تازه
//    با status='pending' ساخته می‌شود، نه 'active' — تا در پنل مدیریت به‌عنوان «درخواست در
//    انتظار» دیده شود، (د) اگر کاربر قبلاً یک‌بار رد شده، به‌جای ساختن ردیف تکراری (که Unique
//    Constraint اجازه نمی‌دهد)، همان ردیف قبلی را به 'pending' برمی‌گرداند تا کاربر بتواند دوباره
//    تلاش کند.
// ۲) sendTextMessageAction و sendVoiceMessageAction حالا به‌جای تابع boolean قدیمی
//    (assertMembership)، از تابع تازه‌ی getConversationMembership استفاده می‌کنند که علاوه بر
//    تایید عضویت، contextType/status گفتگو را هم برمی‌گرداند — تا بتوانند بعد از ارسال موفقِ
//    پیام، در صورت لزوم، «تاییدِ خودکار» گفتگوی پشتیبانی را هم انجام دهند (رجوع کنید به
//    autoActivateIfAdminReplied پایین همین فایل).
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { isUserVip } from "@/lib/vip/vipStatus";
import { canUserStartNewConversation } from "@/lib/chat/chatLimits";
import { getSupportAdminId, ADMIN_SUPPORT_CONTEXT_TYPE } from "@/lib/chat/adminSupportChat";
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

// فاز ۱۳ — شروع (یا بازیابی/تلاش دوباره‌ی) گفتگوی «چت با پشتیبانی». برخلاف startConversationAction:
// هیچ ownerId از سمت کلاینت گرفته نمی‌شود (همیشه سمت سرور با getSupportAdminId تعیین می‌شود، تا
// کاربر نتواند با دستکاری آرگومان‌ها یک گفتگوی جعلی با شناسه‌ی دلخواه بسازد) و هیچ سقف روزانه‌ای
// اعمال نمی‌شود.
export async function startAdminSupportConversationAction(): Promise<
  ActionResult<{ conversationId: string }>
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const supportAdminId = await getSupportAdminId();
  if (!supportAdminId) {
    // نبودِ هیچ حساب ادمینی در سامانه یک حالت پیکربندی‌نشده است، نه یک خطای معمولی کاربر.
    return { success: false, error: "unavailable" };
  }

  if (user.id === supportAdminId) {
    // خودِ حساب ادمین پشتیبانی هرگز این اکشن را صدا نمی‌زند (دکمه‌ی مربوطه در UI برایش
    // نمایش داده نمی‌شود)؛ این فقط یک محافظِ دفاع‌در-عمق است.
    return { success: false, error: "cannotChatWithSelf" };
  }

  const { data: existing } = await supabaseAdminClient
    .from("conversations")
    .select("id, status")
    .eq("context_type", ADMIN_SUPPORT_CONTEXT_TYPE)
    .eq("context_id", supportAdminId)
    .eq("initiator_id", user.id)
    .maybeSingle();

  if (existing) {
    // اگر درخواست قبلی رد شده بود، تلاش تازه‌ی کاربر آن را دوباره به «در انتظار تایید» برمی‌گرداند
    // (نه یک ردیف دوم — Unique Constraint هم اصلاً اجازه‌ی آن را نمی‌دهد)، تا در صفِ پنل مدیریت
    // دوباره دیده شود. اگر از قبل pending یا active بود، همان‌طور دست‌نخورده می‌ماند.
    if (existing.status === "rejected") {
      await supabaseAdminClient
        .from("conversations")
        .update({ status: "pending", requested_at: new Date().toISOString(), responded_at: null })
        .eq("id", existing.id as string);
    }
    return { success: true, conversationId: existing.id as string };
  }

  const { data: created, error } = await supabaseAdminClient
    .from("conversations")
    .insert({
      context_type: ADMIN_SUPPORT_CONTEXT_TYPE,
      context_id: supportAdminId,
      initiator_id: user.id,
      owner_id: supportAdminId,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  // هم‌الگو با startConversationAction: نقض Unique Constraint یعنی هم‌زمان یک درخواست دیگر همین
  // گفتگو را ساخته — همان ردیف موجود خوانده و برگردانده می‌شود.
  if (error?.code === "23505") {
    const { data: raceWinner } = await supabaseAdminClient
      .from("conversations")
      .select("id")
      .eq("context_type", ADMIN_SUPPORT_CONTEXT_TYPE)
      .eq("context_id", supportAdminId)
      .eq("initiator_id", user.id)
      .maybeSingle();
    if (raceWinner) return { success: true, conversationId: raceWinner.id as string };
  }

  if (error || !created) return { success: false, error: "dbError" };

  return { success: true, conversationId: created.id as string };
}

type ConversationMembership = {
  initiatorId: string;
  ownerId: string;
  contextType: ChatContextType;
  status: "pending" | "active" | "rejected";
};

// فاز ۱۳ — جایگزینِ assertMembership قبلی: علاوه بر تایید عضویت، contextType/status گفتگو را هم
// برمی‌گرداند (بدون افزودن یک کوئری دوم) تا اکشن‌های ارسال پیام بتوانند «تاییدِ ضمنیِ» گفتگوی
// پشتیبانی را (رجوع کنید به توضیح پایین‌تر) بدون خواندن دوباره از دیتابیس بررسی کنند.
//
// **رفع باگ (دسترسی همه‌ی ادمین‌ها به چت پشتیبانی):** قبلاً فقط همان یک حساب ثابتی که owner_id
// گفتگو به آن اشاره می‌کرد (قدیمی‌ترین حساب ادمین) عضو گفتگو محسوب می‌شد؛ هر ادمین دیگری هنگام
// تلاش برای ارسال پیام/ویس با خطای «unauthorized» مواجه می‌شد. حالا پارامتر تازه‌ی
// viewerIsAdmin هم پذیرفته می‌شود: اگر گفتگو از نوع admin_support باشد و فرستنده هر کاربری با
// نقش ادمین باشد، عضو محسوب می‌شود — دقیقاً هم‌سو با همان تصمیم در getConversationForUser
// (src/lib/chat/chatQueries.ts).
async function getConversationMembership(
  conversationId: string,
  userId: string,
  viewerIsAdmin: boolean = false
): Promise<ConversationMembership | null> {
  const { data } = await supabaseAdminClient
    .from("conversations")
    .select("initiator_id, owner_id, context_type, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!data) return null;

  const contextType = data.context_type as ChatContextType;
  const isAdminSupportChat = contextType === "admin_support";
  const isMember =
    data.initiator_id === userId ||
    data.owner_id === userId ||
    (isAdminSupportChat && viewerIsAdmin);

  if (!isMember) return null;

  return {
    initiatorId: data.initiator_id as string,
    ownerId: data.owner_id as string,
    contextType,
    status: (data.status as "pending" | "active" | "rejected" | null) ?? "active",
  };
}

// فاز ۱۳ — اگر این پیام را هر کاربری با نقش ادمین در یک گفتگوی «پشتیبانی در انتظار تایید»
// فرستاده باشد، همین پاسخ خودش یک تاییدِ ضمنی محسوب می‌شود: وضعیت به‌طور خودکار 'active' می‌شود —
// دقیقاً هم‌معنای دکمه‌ی «تایید» در پنل مدیریت (src/app/[lang]/admin/(protected)/chats/actions.ts)،
// فقط با یک مسیر کوتاه‌تر برای مدیری که ترجیح می‌دهد به‌جای زدن دکمه‌ی تایید، مستقیم پاسخ بدهد.
//
// **رفع باگ:** قبلاً این تایید خودکار فقط وقتی اتفاق می‌افتاد که فرستنده دقیقاً همان owner_id
// ثابت گفتگو باشد؛ حالا معیار «آیا فرستنده ادمین است؟» جایگزین آن شده — چون هر ادمینی که پاسخ
// می‌دهد، باید بتواند گفتگو را از حالت pending خارج کند.
async function autoActivateIfAdminReplied(
  membership: ConversationMembership,
  conversationId: string,
  senderIsAdmin: boolean
) {
  if (
    membership.contextType === "admin_support" &&
    membership.status === "pending" &&
    senderIsAdmin
  ) {
    await supabaseAdminClient
      .from("conversations")
      .update({ status: "active", responded_at: new Date().toISOString() })
      .eq("id", conversationId);
  }
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

  const membership = await getConversationMembership(conversationId, user.id, user.role === "admin");
  if (!membership) return { success: false, error: "unauthorized" };

  const { error: insertError } = await supabaseAdminClient.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    message_type: "text",
    content: trimmed,
  });

  if (insertError) return { success: false, error: "dbError" };

  await autoActivateIfAdminReplied(membership, conversationId, user.role === "admin");

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

  const membership = await getConversationMembership(conversationId, user.id, user.role === "admin");
  if (!membership) return { success: false, error: "unauthorized" };

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

  const membership = await getConversationMembership(conversationId, user.id, user.role === "admin");
  if (!membership) return { success: false, error: "unauthorized" };

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

  await autoActivateIfAdminReplied(membership, conversationId, user.role === "admin");

  await supabaseAdminClient
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/${lang}/chat/${conversationId}`);
  return { success: true };
}