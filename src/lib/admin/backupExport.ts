// مسیر فایل: src/lib/admin/backupExport.ts
// تسک ۸ فاز ۰۷ — تولید نسخه‌ی کامل «بک‌آپ» اطلاعات کاربران به‌شکل JSON (بند ۹.۴ سند راهبردی:
// «امکان دریافت نسخه‌ی پشتیبان از اطلاعات کاربران، از طریق دکمه‌ی اختصاصی تهیه بک‌آپ در پنل
// مدیریت»). جدول‌های اصلی حاوی داده‌ی واقعی کاربران/آگهی‌ها خوانده می‌شوند.
//
// عمداً کنار گذاشته شدند: `otp_codes` (کدهای موقت، نه داده‌ی ماندگار کاربر)، `admin_logs` و
// `service_categories` (پیکربندی/لاگ داخلی سیستم، نه «اطلاعات کاربران» طبق متن دقیق بند ۹.۴).
//
// خروجی این فایل، عیناً هر ردیف هر جدول (بدون هیچ فیلتر ستونی) است — چون هدف بک‌آپ حفظ کامل داده
// جهت بازیابی احتمالی است، نه نمایش در رابط کاربری (جایی که فیلترکردن ستون‌های حساس معنا دارد، مثل
// publicProfileQueries.ts). به همین دلیل این فایل هم مثل بقیه‌ی کوئری‌های ادمین از
// supabaseAdminClient (Service Role) استفاده می‌کند.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

const BACKUP_TABLES = [
  "users",
  "listings",
  "drivers",
  "service_providers",
  "real_estate",
  "reports",
] as const;

type BackupTableName = (typeof BACKUP_TABLES)[number];

export type BackupSnapshot = {
  generatedAt: string;
  tables: Record<BackupTableName, unknown[]>;
};

export async function generateBackupSnapshot(): Promise<BackupSnapshot> {
  const results = await Promise.all(
    BACKUP_TABLES.map((table) => supabaseAdminClient.from(table).select("*"))
  );

  const tables = {} as Record<BackupTableName, unknown[]>;
  BACKUP_TABLES.forEach((table, index) => {
    const { data, error } = results[index];
    if (error) {
      // عمداً throw نمی‌شود: اگر یک جدول خواندنی نشد، بقیه‌ی بک‌آپ همچنان تولید و دانلود می‌شود؛
      // فقط خطا در کنسول سرور ثبت می‌شود (هم‌الگو با طراحی logAdminAction).
      console.error(`generateBackupSnapshot: خواندن جدول ${table} ناموفق بود`, error);
    }
    tables[table] = data ?? [];
  });

  return {
    generatedAt: new Date().toISOString(),
    tables,
  };
}