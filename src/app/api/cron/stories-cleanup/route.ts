// مسیر فایل: src/app/api/cron/stories-cleanup/route.ts
// قابلیت استوری — پاکسازی خودکار استوری‌های منقضی‌شده. دقیقاً هم‌الگو با
// src/app/api/cron/chat-cleanup/route.ts (فاز ۱۲): یک Route Handler ساده که از طریق Vercel Cron
// Jobs یا یک سرویس بیرونی (مثل cron-job.org — همان روشی که این پروژه از قبل برای chat-cleanup و
// deactivate-stale-drivers استفاده می‌کند) به‌صورت دوره‌ای صدا زده می‌شود.
//
// چرا نیاز به این Cron داریم، با این‌که همه‌جای کوئری‌ها همین الان هم expires_at > now() را فیلتر
// می‌کنند: آن فیلتر فقط باعث می‌شود استوری‌های منقضی «دیگر دیده نشوند»، اما ردیف دیتابیس و
// فایلِ واقعی در Storage همچنان باقی می‌مانند — این Cron همان پاک‌سازی فیزیکی/نهایی را انجام
// می‌دهد، تا هم حجم باکت Storage (که روی Supabase رایگان محدود است) بی‌رویه رشد نکند، هم جدول
// stories با ردیف‌های مرده انباشته نشود.
//
// ترتیب کار (دقیقاً هم‌ترتیب chat-cleanup): ۱) استوری‌های منقضی‌شده را پیدا کن و خودِ فایل‌شان
// را از باکت Storage عمومی «stories» پاک کن (تا فایل یتیم نماند) ۲) ردیف‌های دیتابیس را حذف کن.
import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase/server";

const STORIES_BUCKET = "stories";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  // ۱) استوری‌های منقضی‌شده را پیدا کن تا فایل‌های Storage‌شان قبل از حذف ردیف پاک شوند.
  const { data: expiredStories, error: fetchError } = await supabaseAdminClient
    .from("stories")
    .select("id, media_path")
    .lt("expires_at", nowIso);

  if (fetchError) {
    console.error("[YAKJA][Cron][stories-cleanup]", fetchError);
    return NextResponse.json({ error: "dbError" }, { status: 500 });
  }

  const mediaPaths = (expiredStories ?? [])
    .map((s) => s.media_path as string | null)
    .filter((p): p is string => !!p);

  if (mediaPaths.length > 0) {
    try {
      await supabaseAdminClient.storage.from(STORIES_BUCKET).remove(mediaPaths);
    } catch (err) {
      // اگر پاک‌کردن فایل‌های Storage شکست بخورد، همچنان ردیف‌های دیتابیس را پاک می‌کنیم — یک
      // فایل یتیم در Storage خیلی بهتر از توقف کامل پاکسازی به‌خاطر یک خطای گذراست.
      console.error("[YAKJA][Cron][stories-cleanup] حذف فایل‌های رسانه ناموفق بود", err);
    }
  }

  // ۲) خودِ ردیف‌های استوریِ منقضی‌شده را حذف کن.
  const { data: deletedStories, error: deleteError } = await supabaseAdminClient
    .from("stories")
    .delete()
    .lt("expires_at", nowIso)
    .select("id");

  if (deleteError) {
    console.error("[YAKJA][Cron][stories-cleanup]", deleteError);
    return NextResponse.json({ error: "dbError" }, { status: 500 });
  }

  return NextResponse.json({
    deletedStoriesCount: deletedStories?.length ?? 0,
  });
}