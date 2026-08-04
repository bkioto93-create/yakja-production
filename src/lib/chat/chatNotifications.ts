// مسیر فایل: src/lib/chat/chatNotifications.ts
// فاز ۱۴ — شمارش «گفتگوهای خوانده‌نشده» برای نشان کوچک روی زنگوله‌ی اعلان.
//
// معنی «خوانده‌نشده»: یک گفتگو برای این بیننده «خوانده‌نشده» است اگر و فقط اگر:
//   ۱) آخرین پیام گفتگو (last_message_at) بعد از last_read_at این بیننده باشد،
//      یا last_read_at این بیننده NULL باشد (یعنی هرگز باز نکرده)؛
//   ۲) آخرین پیام از خودِ این بیننده نبوده باشد.
//
// چرا «تعداد گفتگو» و نه «تعداد پیام»: هم‌الگو با تلگرام/اینستاگرام — نشان روی
// زنگوله به کاربر می‌گوید «به X گفتگو باید سر بزنی»، نه یک عدد ممکن‌الرشد که
// بی‌فایده بزرگ می‌شود.
//
// گفتگوی «پشتیبانی» (admin_support): طبق تصمیم صریح کارفرما، همه‌ی ادمین‌ها یک
// صندوق مشترک دارند. ستون owner_last_read_at برای این گفتگوها همچون «آخرین
// باری که تیم پشتیبانی (هر ادمینی از تیم) این را دید» رفتار می‌کند — دقیقاً
// هم‌الگو با Intercom/Zendesk.
//
// طراحی کوئری: به‌جای یک RPC سفارشی روی Postgres، از سه کوئری سبک (که ایندکس
// خودشان را در مایگریشن گرفته‌اند) استفاده می‌کنیم و شمارش را در حافظه انجام
// می‌دهیم. در حجم فعلی پروژه (بیشترین حجم یک کاربر: چند ده گفتگو) این کاملاً
// بی‌مشکل و سریع است. مزیت: هیچ RPC نگهداری‌شونده‌ای اضافه نمی‌کنیم.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { ADMIN_SUPPORT_CONTEXT_TYPE } from "@/lib/chat/adminSupportChat";

export type UnreadChatViewer = {
  userId: string;
  // فقط برای کاربری با role='admin' true است — دقیقاً همان قاعده‌ای که در
  // getConversationForUser برای اجازه‌ی مشاهده استفاده کردیم.
  isAdmin: boolean;
};

type ConversationReadRow = {
  id: string;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  initiator_last_read_at?: string | null;
  owner_last_read_at?: string | null;
  initiator_id?: string;
};

// آیا این گفتگو «خوانده‌نشده» است؟ منطق مشترک بین همه‌ی حالت‌ها.
function isUnread(
  lastMessageAt: string | null,
  lastReadAt: string | null | undefined,
  lastMessageSenderId: string | null,
  viewerIdentityForSelfSent: string
): boolean {
  if (!lastMessageAt) return false; // گفتگوی خالی — چیزی برای خواندن نیست.
  if (lastMessageSenderId === viewerIdentityForSelfSent) return false; // آخرین پیام از خودم.
  if (!lastReadAt) return true; // هرگز باز نکرده‌ام.
  return new Date(lastMessageAt) > new Date(lastReadAt);
}

// گفتگوهایی که این کاربر آغازکننده‌ی آن‌هاست.
async function countAsInitiator(userId: string): Promise<number> {
  const { data } = await supabaseAdminClient
    .from("conversations")
    .select("id, last_message_at, initiator_last_read_at, last_message_sender_id")
    .eq("initiator_id", userId)
    .not("last_message_at", "is", null);

  if (!data) return 0;

  let count = 0;
  for (const row of data as ConversationReadRow[]) {
    if (isUnread(row.last_message_at, row.initiator_last_read_at, row.last_message_sender_id, userId)) {
      count += 1;
    }
  }
  return count;
}

// گفتگوهایی که این کاربر «صاحب» آن‌هاست (کسی به آگهی/پروفایل او پیام داده).
// گفتگوهای admin_support اینجا شمرده نمی‌شوند — تا از دوشمار‌گیری در حالت
// ادمین (که در شاخه‌ی جداگانه شمرده می‌شوند) جلوگیری شود.
async function countAsOwner(userId: string): Promise<number> {
  const { data } = await supabaseAdminClient
    .from("conversations")
    .select("id, last_message_at, owner_last_read_at, last_message_sender_id, context_type")
    .eq("owner_id", userId)
    .not("last_message_at", "is", null)
    .neq("context_type", ADMIN_SUPPORT_CONTEXT_TYPE);

  if (!data) return 0;

  let count = 0;
  for (const row of data as ConversationReadRow[]) {
    if (isUnread(row.last_message_at, row.owner_last_read_at, row.last_message_sender_id, userId)) {
      count += 1;
    }
  }
  return count;
}

// صندوق پشتیبانی مشترک — فقط برای ادمین. همه‌ی گفتگوهای admin_support را
// می‌بیند فارغ از این‌که owner_id به کدام حساب اشاره می‌کند.
async function countAdminSupportInbox(): Promise<number> {
  const { data } = await supabaseAdminClient
    .from("conversations")
    .select("id, last_message_at, owner_last_read_at, last_message_sender_id, initiator_id")
    .eq("context_type", ADMIN_SUPPORT_CONTEXT_TYPE)
    .not("last_message_at", "is", null);

  if (!data) return 0;

  let count = 0;
  for (const row of data as ConversationReadRow[]) {
    // برای صندوق مشترک، «خوانده‌نشده» یعنی: initiator (کاربر درخواست‌کننده)
    // پیامی فرستاده که بعد از owner_last_read_at آمده. پیام‌های پاسخِ خودِ
    // ادمین‌ها اینجا شمرده نمی‌شوند — همان معنای طبیعی: پاسخ خودم، دیگر
    // نیازمند خواندن دوباره‌ی من نیست.
    if (row.last_message_sender_id !== row.initiator_id) continue;
    if (isUnread(row.last_message_at, row.owner_last_read_at, row.last_message_sender_id, "")) {
      count += 1;
    }
  }
  return count;
}

// خروجی اصلی: مجموع «تعداد گفتگوهای خوانده‌نشده» برای این بیننده.
// برای کاربر مهمان (viewer=null) همیشه صفر برمی‌گرداند.
export async function getUnreadChatCount(
  viewer: UnreadChatViewer | null
): Promise<number> {
  if (!viewer) return 0;

  const [asInitiator, asOwner, adminInbox] = await Promise.all([
    countAsInitiator(viewer.userId),
    countAsOwner(viewer.userId),
    viewer.isAdmin ? countAdminSupportInbox() : Promise.resolve(0),
  ]);

  return asInitiator + asOwner + adminInbox;
}