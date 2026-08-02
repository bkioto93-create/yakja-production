// مسیر فایل: src/lib/chat/chatQueries.ts
// فاز ۱۲ — لایه‌ی خواندنِ گفتگوها و پیام‌ها. دقیقاً هم‌الگو با src/lib/vip/vipQueries.ts و
// src/lib/vip/adminVipQueries.ts: چون هیچ Foreign Key واقعی/Join مستقیمی بین conversations و
// جدول‌های ۴‌گانه‌ی context (listings/drivers/service_providers/real_estate) برای supabase-js
// تعریف نشده، اطلاعات «موضوع گفتگو» (عنوان/عکس) با کوئری‌های دسته‌ای دوم خوانده و در حافظه
// ترکیب می‌شود.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getListingImageUrl } from "@/lib/marketplace/images";
import { getDriverImageUrl } from "@/lib/transport/images";
import { getServiceProviderImageUrl } from "@/lib/services/images";
import { getRealEstateImageUrl } from "@/lib/realEstate/images";

export type ChatContextType = "listing" | "driver" | "service_provider" | "real_estate";

export type ConversationContextInfo = {
  label: string;
  imageUrl: string | null;
};

// خواندن «موضوع گفتگو» (عنوان کوتاه + عکس) برای یک context مشخص — برای صفحه‌ی تکیِ یک گفتگو.
// چون هر ۴ جدول context ساختار متفاوتی دارند (فقط listings عنوان/title دارد)، برچسب هرکدام
// جداگانه ساخته می‌شود؛ اگر خودِ ردیف context حذف شده باشد (مثلاً آگهی توسط ادمین حذف شد)، یک
// برچسب عمومی fallback برگردانده می‌شود تا گفتگوی قدیمی همچنان قابل‌مشاهده بماند.
export async function getConversationContextInfo(
  contextType: ChatContextType,
  contextId: string,
  fallbackLabel: string
): Promise<ConversationContextInfo> {
  switch (contextType) {
    case "listing": {
      const { data } = await supabaseAdminClient
        .from("listings")
        .select("title, images")
        .eq("id", contextId)
        .maybeSingle();
      if (!data) return { label: fallbackLabel, imageUrl: null };
      const images = (data.images as string[]) ?? [];
      return { label: data.title as string, imageUrl: images[0] ? getListingImageUrl(images[0]) : null };
    }
    case "real_estate": {
      const { data } = await supabaseAdminClient
        .from("real_estate")
        .select("property_type, deal_type, images")
        .eq("id", contextId)
        .maybeSingle();
      if (!data) return { label: fallbackLabel, imageUrl: null };
      const images = (data.images as string[]) ?? [];
      return {
        label: `${data.property_type} · ${data.deal_type}`,
        imageUrl: images[0] ? getRealEstateImageUrl(images[0]) : null,
      };
    }
    case "driver": {
      const { data } = await supabaseAdminClient
        .from("drivers")
        .select("vehicle_type, images")
        .eq("id", contextId)
        .maybeSingle();
      if (!data) return { label: fallbackLabel, imageUrl: null };
      const images = (data.images as string[]) ?? [];
      return { label: data.vehicle_type as string, imageUrl: images[0] ? getDriverImageUrl(images[0]) : null };
    }
    case "service_provider": {
      const { data } = await supabaseAdminClient
        .from("service_providers")
        .select("images, service_category_id")
        .eq("id", contextId)
        .maybeSingle();
      if (!data) return { label: fallbackLabel, imageUrl: null };
      const images = (data.images as string[]) ?? [];
      const { data: category } = await supabaseAdminClient
        .from("service_categories")
        .select("name_fa")
        .eq("id", data.service_category_id as string)
        .maybeSingle();
      return {
        label: (category?.name_fa as string | undefined) ?? fallbackLabel,
        imageUrl: images[0] ? getServiceProviderImageUrl(images[0]) : null,
      };
    }
  }
}

export type ConversationView = {
  id: string;
  contextType: ChatContextType;
  contextId: string;
  otherUserId: string;
  otherUserName: string | null;
  otherUserIsVip: boolean;
  contextLabel: string;
  contextImageUrl: string | null;
  lastMessageAt: string;
};

// یک گفتگوی مشخص را می‌خواند، فقط اگر کاربر جاری واقعاً یکی از دو طرف آن باشد (کنترل دسترسی واقعی
// همین‌جا انجام می‌شود، نه صرفاً در UI) — اگر نبود یا گفتگو وجود نداشت، null برمی‌گردد.
export async function getConversationForUser(
  conversationId: string,
  userId: string,
  fallbackLabel: string
): Promise<ConversationView | null> {
  const { data, error } = await supabaseAdminClient
    .from("conversations")
    .select("id, context_type, context_id, initiator_id, owner_id, last_message_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.initiator_id !== userId && data.owner_id !== userId) return null;

  const otherUserId = data.initiator_id === userId ? data.owner_id : data.initiator_id;

  const [{ data: otherUser }, contextInfo] = await Promise.all([
    supabaseAdminClient.from("users").select("name, vip_expires_at").eq("id", otherUserId).maybeSingle(),
    getConversationContextInfo(data.context_type as ChatContextType, data.context_id as string, fallbackLabel),
  ]);

  return {
    id: data.id as string,
    contextType: data.context_type as ChatContextType,
    contextId: data.context_id as string,
    otherUserId,
    otherUserName: (otherUser?.name as string | null) ?? null,
    otherUserIsVip: otherUser
      ? new Date(otherUser.vip_expires_at as string).getTime() > Date.now()
      : false,
    contextLabel: contextInfo.label,
    contextImageUrl: contextInfo.imageUrl,
    lastMessageAt: data.last_message_at as string,
  };
}

export type ChatMessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: "text" | "voice";
  content: string | null;
  voiceUrl: string | null;
  voiceDurationSeconds: number | null;
  createdAt: string;
};

const VOICE_BUCKET = "chat-voice-messages";
const VOICE_SIGNED_URL_TTL_SECONDS = 60 * 60; // ۱ ساعت — کافی برای باز نگه‌داشتن یک صفحه‌ی چت

// خواندن پیام‌های یک گفتگو، جدیدترین در انتها. چون باکت ویس خصوصی است (نه public)، برای هر پیام
// صوتی یک آدرس امضاشده‌ی موقت (Signed URL) ساخته می‌شود — نه یک لینک ثابت و همیشگی.
export async function getConversationMessages(
  conversationId: string,
  limit = 100
): Promise<ChatMessageView[]> {
  const { data, error } = await supabaseAdminClient
    .from("chat_messages")
    .select("id, conversation_id, sender_id, message_type, content, voice_path, voice_duration_seconds, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  const voicePaths = data.filter((m) => m.voice_path).map((m) => m.voice_path as string);
  const signedUrlMap = new Map<string, string>();

  if (voicePaths.length > 0) {
    const { data: signedUrls } = await supabaseAdminClient.storage
      .from(VOICE_BUCKET)
      .createSignedUrls(voicePaths, VOICE_SIGNED_URL_TTL_SECONDS);

    for (const item of signedUrls ?? []) {
      if (item.signedUrl && item.path) signedUrlMap.set(item.path, item.signedUrl);
    }
  }

  return data.map((row) => ({
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    messageType: row.message_type as "text" | "voice",
    content: row.content as string | null,
    voiceUrl: row.voice_path ? (signedUrlMap.get(row.voice_path as string) ?? null) : null,
    voiceDurationSeconds: row.voice_duration_seconds as number | null,
    createdAt: row.created_at as string,
  }));
}

export type MyConversationRow = {
  id: string;
  contextType: ChatContextType;
  contextLabel: string;
  contextImageUrl: string | null;
  otherUserId: string;
  otherUserName: string | null;
  otherUserIsVip: boolean;
  lastMessagePreview: string;
  lastMessageAt: string;
};

// فهرست «چت‌های من» — گفتگوهایی که کاربر یا آغازکننده‌شان بوده یا صاحبِ آگهی/پروفایل مقابل بوده،
// مرتب‌شده بر اساس جدیدترین فعالیت. برای عملکرد بهتر، اطلاعات context هر گفتگو به‌صورت دسته‌ای
// (گروه‌بندی‌شده بر اساس نوع) خوانده می‌شود، نه با یک کوئری جدا برای هر ردیف.
export async function getMyConversations(
  userId: string,
  fallbackLabel: string,
  voiceMessagePreviewLabel: string
): Promise<MyConversationRow[]> {
  const { data, error } = await supabaseAdminClient
    .from("conversations")
    .select("id, context_type, context_id, initiator_id, owner_id, last_message_at")
    .or(`initiator_id.eq.${userId},owner_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  const otherUserIds = Array.from(
    new Set(data.map((row) => (row.initiator_id === userId ? row.owner_id : row.initiator_id) as string))
  );
  const conversationIds = data.map((row) => row.id as string);

  const [{ data: users }, { data: lastMessages }] = await Promise.all([
    supabaseAdminClient.from("users").select("id, name, vip_expires_at").in("id", otherUserIds),
    // آخرین پیام هر گفتگو، برای پیش‌نمایش متنی در فهرست — همه با یک کوئری، مرتب‌شده تا جدیدترین هر
    // conversation_id اول بیاید (سپس در حافظه فقط اولین‌ِ هر گروه نگه داشته می‌شود).
    supabaseAdminClient
      .from("chat_messages")
      .select("conversation_id, message_type, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const usersMap = new Map((users ?? []).map((u) => [u.id as string, u]));
  const lastMessageMap = new Map<string, { messageType: string; content: string | null }>();
  for (const m of lastMessages ?? []) {
    const key = m.conversation_id as string;
    if (!lastMessageMap.has(key)) {
      lastMessageMap.set(key, { messageType: m.message_type as string, content: m.content as string | null });
    }
  }

  // اطلاعات context هر گفتگو — گروه‌بندی بر اساس نوع تا کوئری‌های تکراری روی یک جدول اجرا نشود.
  const contextByTypeAndId = new Map<string, ConversationContextInfo>();
  const byType: Record<ChatContextType, string[]> = {
    listing: [],
    driver: [],
    service_provider: [],
    real_estate: [],
  };
  for (const row of data) {
    byType[row.context_type as ChatContextType].push(row.context_id as string);
  }

  for (const [contextType, ids] of Object.entries(byType) as [ChatContextType, string[]][]) {
    if (ids.length === 0) continue;
    for (const id of Array.from(new Set(ids))) {
      const info = await getConversationContextInfo(contextType, id, fallbackLabel);
      contextByTypeAndId.set(`${contextType}:${id}`, info);
    }
  }

  return data.map((row) => {
    const otherUserId = (row.initiator_id === userId ? row.owner_id : row.initiator_id) as string;
    const otherUser = usersMap.get(otherUserId);
    const contextInfo = contextByTypeAndId.get(`${row.context_type}:${row.context_id}`) ?? {
      label: fallbackLabel,
      imageUrl: null,
    };
    const lastMessage = lastMessageMap.get(row.id as string);

    return {
      id: row.id as string,
      contextType: row.context_type as ChatContextType,
      contextLabel: contextInfo.label,
      contextImageUrl: contextInfo.imageUrl,
      otherUserId,
      otherUserName: (otherUser?.name as string | null) ?? null,
      otherUserIsVip: otherUser
        ? new Date(otherUser.vip_expires_at as string).getTime() > Date.now()
        : false,
      lastMessagePreview: lastMessage
        ? lastMessage.messageType === "voice"
          ? voiceMessagePreviewLabel
          : (lastMessage.content ?? "")
        : "",
      lastMessageAt: row.last_message_at as string,
    };
  });
}