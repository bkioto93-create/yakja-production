// مسیر فایل: src/lib/chat/chatLimits.ts
// فاز ۱۲ — سقف روزانه‌ی «گفتگوی تازه» برای کاربر رایگان (غیر VIP): ۲ گفتگوی تازه در روز.
//
// نکته‌ی مهم طراحی: این سقف فقط روی *شروعِ* یک گفتگوی تازه با یک صاحبِ آگهی/پروفایل جدید اعمال
// می‌شود — نه روی تعداد پیام‌ها. اگر کاربر همین امروز (یا حتی دیروز، تا وقتی گفتگو هنوز پاک نشده)
// با کسی گفتگو را شروع کرده، ادامه‌ی همان گفتگو همیشه و بدون هیچ محدودیتی آزاد است؛ فقط شروعِ
// گفتگوی *سوم* با یک فرد تازه در همان روز است که گیت می‌شود. دقیقاً هم‌الگو با
// src/lib/vip/dailyPostLimit.ts (همان مرز روز به وقت Asia/Kabul)، عمداً یک تابع کاملاً مستقل تا
// اگر بعداً عدد ۲ عوض شد، تغییرش یک‌جا و ساده باشد.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getStartOfTodayInKabulUtc } from "@/lib/vip/dailyPostLimit";

export const FREE_DAILY_NEW_CONVERSATIONS_LIMIT = 2;

// شمارش «گفتگوهای تازه‌ای که همین کاربر امروز، به‌عنوان آغازکننده، شروع کرده».
export async function getUserNewConversationsCountToday(userId: string): Promise<number> {
  const startOfToday = getStartOfTodayInKabulUtc().toISOString();

  const { count } = await supabaseAdminClient
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("initiator_id", userId)
    .gte("created_at", startOfToday);

  return count ?? 0;
}

// بررسی «آیا این کاربر اجازه‌ی شروع یک گفتگوی *تازه* را دارد؟» — این تابع فقط برای گفتگوهای
// جدید صدا زده می‌شود؛ ادامه‌دادن یک گفتگوی موجود هرگز از این مسیر رد نمی‌شود (رجوع کنید به
// src/app/[lang]/chat/actions.ts: startConversationAction ابتدا بررسی می‌کند گفتگو از قبل وجود
// دارد یا نه — فقط برای واقعاً-تازه این تابع صدا زده می‌شود).
export async function canUserStartNewConversation(params: {
  userId: string;
  isVip: boolean;
}): Promise<{ allowed: boolean; currentCount: number }> {
  if (params.isVip) return { allowed: true, currentCount: 0 };

  const currentCount = await getUserNewConversationsCountToday(params.userId);
  return { allowed: currentCount < FREE_DAILY_NEW_CONVERSATIONS_LIMIT, currentCount };
}