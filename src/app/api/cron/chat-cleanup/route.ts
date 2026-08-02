// مسیر فایل: src/app/api/cron/chat-cleanup/route.ts
// فاز ۱۲ — پاکسازی خودکار پیام‌های چت قدیمی‌تر از ۲۴ ساعت. دقیقاً هم‌الگو با
// src/app/api/cron/deactivate-stale-drivers/route.ts (فاز ۰۳، تسک ۷): یک Route Handler ساده که
// از طریق Vercel Cron Jobs یا یک سرویس بیرونی (مثل cron-job.org) به‌صورت دوره‌ای صدا زده می‌شود.
//
// چرا هر پیام جدا (نه کل گفتگو) پاک می‌شود: طبق تصمیم صریح کارفرما، پیام‌ها باید دقیقاً ۲۴ ساعت
// پس از ارسال خودشان (نه از زمان ساخت گفتگو) ناپدید شوند — یعنی در یک گفتگوی فعال و ادامه‌دار،
// پیام‌های تازه‌تر می‌مانند و فقط پیام‌های قدیمی‌تر به‌مرور پاک می‌شوند؛ دقیقاً همان چیزی که پیام
// هشدار بالای صفحه‌ی چت هم به کاربر می‌گوید («پیام‌ها فقط ۲۴ ساعت نگهداری می‌شوند»).
//
// ترتیب کار: ۱) پیام‌های صوتیِ قدیمی‌تر از ۲۴ ساعت را پیدا کن و خودِ فایل‌شان را از باکت Storage
// خصوصی chat-voice-messages پاک کن (تا فایل یتیم در Storage نماند) ۲) ردیف‌های پیام را از دیتابیس
// حذف کن ۳) گفتگوهایی که دیگر هیچ پیامی ندارند و بیش از ۲۴ ساعت از ساختشان گذشته را هم پاک کن —
// تا ردیف‌های خالی/متروک conversations برای همیشه انباشته نشوند.
import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase/server";

const RETENTION_HOURS = 24;
const VOICE_BUCKET = "chat-voice-messages";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();

  // ۱) پیام‌های صوتیِ منقضی‌شده را پیدا کن تا فایل‌های Storage‌شان قبل از حذف ردیف پاک شوند.
  const { data: expiredVoiceMessages } = await supabaseAdminClient
    .from("chat_messages")
    .select("voice_path")
    .eq("message_type", "voice")
    .lt("created_at", cutoff);

  const voicePaths = (expiredVoiceMessages ?? [])
    .map((m) => m.voice_path as string | null)
    .filter((p): p is string => !!p);

  if (voicePaths.length > 0) {
    try {
      await supabaseAdminClient.storage.from(VOICE_BUCKET).remove(voicePaths);
    } catch (err) {
      // اگر پاک‌کردن فایل‌های Storage شکست بخورد، همچنان ردیف‌های دیتابیس را پاک می‌کنیم — یک
      // فایل یتیم در Storage خیلی بهتر از توقف کامل پاکسازی به‌خاطر یک خطای گذراست.
      console.error("[YAKJA][Cron][chat-cleanup] حذف فایل‌های صوتی ناموفق بود", err);
    }
  }

  // ۲) خودِ ردیف‌های پیام قدیمی‌تر از ۲۴ ساعت را حذف کن (متنی و صوتی، هر دو).
  const { data: deletedMessages, error: deleteMessagesError } = await supabaseAdminClient
    .from("chat_messages")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (deleteMessagesError) {
    console.error("[YAKJA][Cron][chat-cleanup]", deleteMessagesError);
    return NextResponse.json({ error: "dbError" }, { status: 500 });
  }

  // ۳) گفتگوهای متروک (بدون هیچ پیام باقی‌مانده و قدیمی‌تر از ۲۴ ساعت) را هم پاک کن.
  const { data: emptyStaleConversations } = await supabaseAdminClient
    .from("conversations")
    .select("id")
    .lt("created_at", cutoff);

  let deletedConversationsCount = 0;
  if (emptyStaleConversations && emptyStaleConversations.length > 0) {
    const candidateIds = emptyStaleConversations.map((c) => c.id as string);
    const { data: stillHasMessages } = await supabaseAdminClient
      .from("chat_messages")
      .select("conversation_id")
      .in("conversation_id", candidateIds);

    const idsWithMessages = new Set((stillHasMessages ?? []).map((m) => m.conversation_id as string));
    const idsToDelete = candidateIds.filter((id) => !idsWithMessages.has(id));

    if (idsToDelete.length > 0) {
      const { data: deletedConversations } = await supabaseAdminClient
        .from("conversations")
        .delete()
        .in("id", idsToDelete)
        .select("id");
      deletedConversationsCount = deletedConversations?.length ?? 0;
    }
  }

  return NextResponse.json({
    deletedMessagesCount: deletedMessages?.length ?? 0,
    deletedConversationsCount,
  });
}