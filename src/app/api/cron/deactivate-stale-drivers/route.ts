// مسیر فایل: src/app/api/cron/deactivate-stale-drivers/route.ts
// تسک ۷ فاز ۰۳ — غیرفعال‌سازی خودکار رانندگانی که موقعیت مکانی‌شان بیش از ۱۰ دقیقه به‌روزرسانی
// نشده است. طبق بند ۵ سند راهبردی، میزبانی پروژه Vercel است؛ به همین دلیل این منطق به‌جای
// pg_cron سمت Supabase (که فعال‌بودنش روی همه‌ی پلن‌ها تضمین‌شده نیست)، از طریق «Vercel Cron
// Jobs» پیاده‌سازی شد: یک Route Handler ساده که Vercel طبق زمان‌بندی vercel.json (هر ۵ دقیقه)
// خودش صدا می‌زند؛ این فاصله‌ی ۵ دقیقه‌ای برای تشخیص «بیش از ۱۰ دقیقه بدون به‌روزرسانی» کافی و
// دقیق‌تر از حد نیاز است (خطای تاخیر حداکثر ~۵ دقیقه، قابل قبول برای این ویژگی).
//
// امنیت: Vercel هنگام صدازدن Cron Jobها، هدر Authorization را با مقدار `Bearer <CRON_SECRET>`
// می‌فرستد (اگر متغیر محیطی CRON_SECRET در پروژه‌ی Vercel تنظیم شده باشد). این تابع همان مقدار
// را بررسی می‌کند تا هیچ‌کس دیگری (خارج از خودِ زمان‌بند Vercel) نتواند این مسیر عمومی را صدا
// بزند و باعث غیرفعال‌سازی دستی/مخرب رانندگان شود.
//
// این هندلر عمداً از supabaseAdminClient استفاده می‌کند (نه کلاینت RLS-محور)، دقیقاً طبق همان
// قاعده‌ی معماری «Server Actions / Route Handlers» که در src/lib/supabase/server.ts مستند شده.
import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase/server";

const STALE_THRESHOLD_MINUTES = 10;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const staleThreshold = new Date(
    Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString();

  // تسک ۷ فاز ۰۳ — هر راننده‌ای که هم‌اکنون «فعال» است ولی آخرین به‌روزرسانی موقعیتش (طبق تسک ۶،
  // یا طبق timestamp تازه‌ای که setDriverActiveStatusAction هنگام روشن‌کردن سوییچ می‌نویسد) از
  // این آستانه قدیمی‌تر باشد، به‌صورت خودکار به «غیرفعال» تغییر می‌کند.
  const { data, error } = await supabaseAdminClient
    .from("drivers")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("last_location_update", staleThreshold)
    .select("id");

  if (error) {
    console.error("[YAKJA][Cron][deactivate-stale-drivers]", error);
    return NextResponse.json({ error: "dbError" }, { status: 500 });
  }

  return NextResponse.json({ deactivatedCount: data?.length ?? 0 });
}