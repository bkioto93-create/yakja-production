// مسیر فایل: src/app/api/admin/backup/route.ts
// تسک ۸ فاز ۰۷ — دکمه‌ی اختصاصی «تهیه بک‌آپ» (بند ۹.۴ سند راهبردی). یک Route Handler به‌جای
// Server Action انتخاب شد چون خروجی این تسک یک فایل قابل‌دانلود است، نه یک نتیجه‌ی درون-صفحه‌ای؛
// مرورگر با یک درخواست GET ساده (لینک <a>، بدون نیاز به جاوااسکریپت — هم‌سو با فلسفه‌ی «بدون نیاز
// به جاوااسکریپت» بقیه‌ی صفحات پنل) هدر Content-Disposition را می‌بیند و فایل را مستقیم دانلود
// می‌کند.
//
// دامنه‌ی این تسک صرفاً «دکمه‌ی دریافت بک‌آپ» است، نه یک سیستم زمان‌بندی‌شده یا بازیابی (Restore)؛
// بازیابی هیچ‌گاه در متن بند ۹.۴ ذکر نشده — خودِ Supabase هم جداگانه پشتیبان‌گیری زیرساختی روزانه
// ارائه می‌دهد (مسئولیت کارفرما، بند ۹).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { generateBackupSnapshot } from "@/lib/admin/backupExport";
import { logAdminAction } from "@/lib/admin/adminLogs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    // هم‌الگو با admin/layout.tsx: دسترسی بدون نشست معتبر ادمین، حتی به این Route Handler هم
    // مستقیماً رد می‌شود — این بررسی، مستقل از هر محافظت UI، خودِ منبع داده را می‌بندد.
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const snapshot = await generateBackupSnapshot();

  // ثبت این اقدام هم در admin_logs (هم‌سو با تسک ۷ همین فاز). چون بک‌آپ روی یک رکورد مشخص
  // (کاربر/آگهی/...) عمل نمی‌کند، شناسه‌ی خودِ ادمین به‌عنوان target_id استفاده شد و target_type
  // برابر «system» تعریف شد (مقدار تازه‌ای که همین تسک به فهرست مقادیر ممکن اضافه می‌کند).
  await logAdminAction({
    adminId: admin.id,
    targetType: "system",
    targetId: admin.id,
    action: "backup_download",
  });

  const filename = `yakja-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}