// مسیر فایل: src/lib/admin/adminStatsQueries.ts
// تسک ۶ فاز ۰۷ — لایه‌ی خواندنِ «داشبورد آماری پایه». طبق متن دقیق بند ۶.۶ سند راهبردی، این
// داشبورد باید دقیقاً ۴ رقم/بخش را نشان دهد: «تعداد کل کاربران»، «تعداد آگهی به‌تفکیک دسته»،
// «تعداد رانندگان فعال»، و «تعداد گزارش‌های در انتظار». رقم چهارم (گزارش‌های در انتظار) عمداً در
// این فایل تکرار نشد؛ چون src/app/[lang]/admin/page.tsx از قبل (تسک ۳) دقیقاً همین عدد را با
// getPendingReportsCount از src/lib/reports/adminReportQueries.ts می‌خواند (برای نشان کارت
// «گزارش‌های تخلف»)، همان مقدار مستقیماً برای بخش آماری هم بازاستفاده می‌شود — یک درخواست
// غیرضروری تکراری به دیتابیس اضافه نشد.
//
// «تعداد آگهی به‌تفکیک دسته» طبق واژه‌ی دقیق «دسته» (category)، فقط به آگهی‌های کالا (جدول
// listings) اشاره دارد — چون فقط این ماژول اصلاً مفهوم «دسته» (category) دارد؛ املاک «نوع ملک»
// دارد نه «دسته»، و حمل‌ونقل/خدمات در ردیف‌های جداگانه‌ی همین داشبورد (رانندگان فعال) پوشش داده
// می‌شوند. شمارش هر دسته با یک کوئری سبک (فقط ستون category، بدون تصاویر/توضیحات) روی آگهی‌های
// غیر-حذف‌شده (status != 'deleted'، یعنی هم در-انتظار و هم تاییدشده) انجام و در حافظه جمع‌بندی
// می‌شود — نه ۹ کوئری COUNT مجزا و نه یک تابع Postgres تازه، دقیقاً هم‌سو با اصل طلایی سادگی
// (بند ۲ سند راهبردی)؛ در مقیاس فعلی پروژه (شهرهای افغانستان، نه یک بازار جهانی)، این حجم داده
// برای خواندن کامل در یک کوئری کاملاً بی‌مشکل است.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { LISTING_CATEGORIES, type ListingCategoryId } from "@/lib/marketplace/categories";

export type ListingCategoryCount = {
  categoryId: ListingCategoryId;
  count: number;
};

export type AdminStats = {
  totalUsersCount: number;
  activeDriversCount: number;
  listingsByCategory: ListingCategoryCount[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const [usersResult, driversResult, listingsResult] = await Promise.all([
    supabaseAdminClient.from("users").select("id", { count: "exact", head: true }),
    supabaseAdminClient
      .from("drivers")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabaseAdminClient.from("listings").select("category").neq("status", "deleted"),
  ]);

  const countByCategory = new Map<string, number>();
  for (const row of listingsResult.data ?? []) {
    const category = row.category as string;
    countByCategory.set(category, (countByCategory.get(category) ?? 0) + 1);
  }

  const listingsByCategory: ListingCategoryCount[] = LISTING_CATEGORIES.map((cat) => ({
    categoryId: cat.id,
    count: countByCategory.get(cat.id) ?? 0,
  }));

  return {
    totalUsersCount: usersResult.count ?? 0,
    activeDriversCount: driversResult.count ?? 0,
    listingsByCategory,
  };
}