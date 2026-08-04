// مسیر فایل: src/lib/chat/chatQueries.ts
// فاز ۱۲ — لایه‌ی خواندنِ گفتگوها و پیام‌ها. دقیقاً هم‌الگو با src/lib/vip/vipQueries.ts و
// src/lib/vip/adminVipQueries.ts: چون هیچ Foreign Key واقعی/Join مستقیمی بین conversations و
// جدول‌های ۴‌گانه‌ی context (listings/drivers/service_providers/real_estate) برای supabase-js
// تعریف نشده، اطلاعات «موضوع گفتگو» (عنوان/عکس) با کوئری‌های دسته‌ای دوم خوانده و در حافظه
// ترکیب می‌شود.
//
// **به‌روزرسانی فاز ۱۳ (چت با مدیر/پشتیبانی):** یک نوع تازه‌ی context اضافه شد: "admin_support".
// برخلاف ۴ نوع قبلی (که context_id به یک ردیف واقعی در جدول‌های listings/drivers/... اشاره
// می‌کند)، اینجا context_id همیشه همان شناسه‌ی ثابتِ حساب ادمینِ پشتیبانی است (رجوع کنید به
// src/lib/chat/adminSupportChat.ts) — یعنی نیازی به کوئری‌گرفتن از هیچ جدولی نیست، فقط یک
// برچسب/آیکون ثابت (که از دیکشنری پاس داده می‌شود، طبق الزام قطعی «ممنوعیت هاردکد متن») برگردانده
// می‌شود. همچنین چون این نوع گفتگو یک گردش‌کار «در انتظار تایید» دارد (ستون تازه‌ی
// conversations.status)، این ستون هم به ConversationView/MyConversationRow اضافه شد.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getListingImageUrl } from "@/lib/marketplace/images";
import { getDriverImageUrl } from "@/lib/transport/images";
import { getServiceProviderImageUrl } from "@/lib/services/images";
import { getRealEstateImageUrl } from "@/lib/realEstate/images";

export type ChatContextType = "listing" | "driver" | "service_provider" | "real_estate" | "admin_support";

// وضعیت گفتگو — برای ۴ نوع قدیمی همیشه "active" است (رفتار قبلی، بدون تغییر)؛ فقط گفتگوی
// "admin_support" می‌تواند "pending" (در انتظار تایید مدیر) یا "rejected" (رد شده) هم باشد.
export type ConversationStatus = "pending" | "active" | "rejected";

// آیکون ثابتِ برند برای نمایش گفتگوی پشتیبانی — یک آدرس فایل استاتیک از public/، نه یک متنِ
// نمایشی به کاربر؛ پس مشمول قاعده‌ی «ممنوعیت هاردکد متن» نیست (دقیقاً هم‌رده با ثابت‌های دیگر این
// فایل مثل نام باکت Storage).
const ADMIN_SUPPORT_ICON_PATH = "/icons/yakja-icon-192.png";

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
  fallbackLabel: string,
  adminSupportLabel: string
): Promise<ConversationContextInfo> {
  switch (contextType) {
    case "admin_support": {
      // بدون کوئری: context_id اینجا یک آگهی/پروفایل واقعی نیست، همیشه شناسه‌ی ثابت ادمین است.
      return { label: adminSupportLabel, imageUrl: ADMIN_SUPPORT_ICON_PATH };
    }
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
  status: ConversationStatus;
  // true فقط برای گفتگوی نوع admin_support — برای این‌که UI نیازی به مقایسه‌ی رشته‌ای
  // contextType === "admin_support" در همه‌جا نداشته باشد.
  isAdminSupportChat: boolean;
  // true فقط وقتی گفتگو از نوع admin_support است و بیننده‌ی فعلی خودِ همان حساب ادمین پشتیبانی
  // است (نه کاربر درخواست‌دهنده) — برای تغییر متن/رفتار سرصفحه در ChatThreadClient.
  viewerIsSupportAdmin: boolean;
};

// یک گفتگوی مشخص را می‌خواند. کنترل دسترسی واقعی همین‌جا انجام می‌شود (نه صرفاً در UI):
// - برای گفتگوهای عادی (کالا/ملک/راننده/متخصص): فقط دو طرفِ واقعیِ همان گفتگو اجازه‌ی دیدن دارند.
// - برای گفتگوی «پشتیبانی» (admin_support): هر کاربری که نقش ادمین دارد (viewerIsAdmin=true)
//   هم اجازه‌ی دیدن دارد — نه فقط همان یک حساب ثابتی که owner_id به آن اشاره می‌کند.
export async function getConversationForUser(
  conversationId: string,
  userId: string,
  fallbackLabel: string,
  adminSupportLabel: string,
  viewerIsAdmin: boolean = false
): Promise<ConversationView | null> {
  const { data, error } = await supabaseAdminClient
    .from("conversations")
    .select("id, context_type, context_id, initiator_id, owner_id, last_message_at, status")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;

  const contextType = data.context_type as ChatContextType;
  const isAdminSupportChat = contextType === "admin_support";

  const isAuthorized =
    data.initiator_id === userId ||
    data.owner_id === userId ||
    (isAdminSupportChat && viewerIsAdmin);

  if (!isAuthorized) return null;

  const otherUserId = data.initiator_id === userId ? data.owner_id : data.initiator_id;
  const otherSideIsSupportAdmin = isAdminSupportChat && otherUserId === data.owner_id;
  const viewerIsSupportAdmin = isAdminSupportChat && (data.owner_id === userId || viewerIsAdmin);

  const [{ data: otherUser }, contextInfo] = await Promise.all([
    supabaseAdminClient.from("users").select("name, vip_expires_at").eq("id", otherUserId).maybeSingle(),
    getConversationContextInfo(contextType, data.context_id as string, fallbackLabel, adminSupportLabel),
  ]);

  return {
    id: data.id as string,
    contextType,
    contextId: data.context_id as string,
    otherUserId,
    // برند «پشتیبانی یکجا» به‌جای نام/نقش واقعی حساب ادمین نمایش داده می‌شود — هم برای یک‌دستیِ
    // ظاهری، هم چون نام ثبت‌شده‌ی حساب ادمین لزوماً چیز مناسبی برای نمایش عمومی نیست.
    otherUserName: otherSideIsSupportAdmin ? adminSupportLabel : ((otherUser?.name as string | null) ?? null),
    otherUserIsVip: otherSideIsSupportAdmin
      ? false
      : otherUser
        ? new Date(otherUser.vip_expires_at as string).getTime() > Date.now()
        : false,
    contextLabel: contextInfo.label,
    contextImageUrl: contextInfo.imageUrl,
    lastMessageAt: data.last_message_at as string,
    status: (data.status as ConversationStatus | null) ?? "active",
    isAdminSupportChat,
    viewerIsSupportAdmin,
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
  status: ConversationStatus;
  isAdminSupportChat: boolean;
};

// فهرست «چت‌های من» — گفتگوهایی که کاربر یا آغازکننده‌شان بوده یا صاحبِ آگهی/پروفایل مقابل بوده،
// مرتب‌شده بر اساس جدیدترین فعالیت. برای عملکرد بهتر، اطلاعات context هر گفتگو به‌صورت دسته‌ای
// (گروه‌بندی‌شده بر اساس نوع) خوانده می‌شود، نه با یک کوئری جدا برای هر ردیف.
export async function getMyConversations(
  userId: string,
  fallbackLabel: string,
  voiceMessagePreviewLabel: string,
  adminSupportLabel: string
): Promise<MyConversationRow[]> {
  const { data, error } = await supabaseAdminClient
    .from("conversations")
    .select("id, context_type, context_id, initiator_id, owner_id, last_message_at, status")
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
  // نوع admin_support عمداً از این گروه‌بندی/کوئری کنار گذاشته شده چون اصلاً به دیتابیس نیاز ندارد.
  const contextByTypeAndId = new Map<string, ConversationContextInfo>();
  const byType: Record<Exclude<ChatContextType, "admin_support">, string[]> = {
    listing: [],
    driver: [],
    service_provider: [],
    real_estate: [],
  };
  for (const row of data) {
    if (row.context_type === "admin_support") continue;
    byType[row.context_type as Exclude<ChatContextType, "admin_support">].push(row.context_id as string);
  }

  for (const [contextType, ids] of Object.entries(byType) as [Exclude<ChatContextType, "admin_support">, string[]][]) {
    if (ids.length === 0) continue;
    for (const id of Array.from(new Set(ids))) {
      const info = await getConversationContextInfo(contextType, id, fallbackLabel, adminSupportLabel);
      contextByTypeAndId.set(`${contextType}:${id}`, info);
    }
  }

  return data.map((row) => {
    const contextType = row.context_type as ChatContextType;
    const otherUserId = (row.initiator_id === userId ? row.owner_id : row.initiator_id) as string;
    const isAdminSupportChat = contextType === "admin_support";
    const otherSideIsSupportAdmin = isAdminSupportChat && otherUserId === row.owner_id;

    const otherUser = usersMap.get(otherUserId);
    const contextInfo = isAdminSupportChat
      ? { label: adminSupportLabel, imageUrl: ADMIN_SUPPORT_ICON_PATH }
      : (contextByTypeAndId.get(`${row.context_type}:${row.context_id}`) ?? {
          label: fallbackLabel,
          imageUrl: null,
        });
    const lastMessage = lastMessageMap.get(row.id as string);

    return {
      id: row.id as string,
      contextType,
      contextLabel: contextInfo.label,
      contextImageUrl: contextInfo.imageUrl,
      otherUserId,
      otherUserName: otherSideIsSupportAdmin
        ? adminSupportLabel
        : ((otherUser?.name as string | null) ?? null),
      otherUserIsVip: otherSideIsSupportAdmin
        ? false
        : otherUser
          ? new Date(otherUser.vip_expires_at as string).getTime() > Date.now()
          : false,
      lastMessagePreview: lastMessage
        ? lastMessage.messageType === "voice"
          ? voiceMessagePreviewLabel
          : (lastMessage.content ?? "")
        : "",
      lastMessageAt: row.last_message_at as string,
      status: (row.status as ConversationStatus | null) ?? "active",
      isAdminSupportChat,
    };
  });
}