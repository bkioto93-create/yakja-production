// مسیر فایل: src/lib/services/serviceCategories.ts
// تسک ۳ فاز ۰۴ — لایه‌ی خواندنِ جدول پویای service_categories برای پنل ادمین. دقیقاً هم‌الگو با
// src/lib/transport/driverQueries.ts (فاز ۰۳): یک select ساده کافی است، چون این جدول (برخلاف
// جستجوی رانندگان/آگهی‌ها) نه فیلتر جغرافیایی دارد و نه صفحه‌بندی لازم دارد — تعداد ردیف‌ها
// همیشه کم است (چند ده تخصص، نه چند هزار آگهی).
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type ServiceCategory = {
  id: string;
  nameFa: string;
  namePs: string;
  iconSource: "builtin" | "custom";
  iconKey: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

type RawServiceCategoryRow = {
  id: string;
  name_fa: string;
  name_ps: string;
  icon_source: string;
  icon_key: string | null;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
};

function mapRow(row: RawServiceCategoryRow): ServiceCategory {
  return {
    id: row.id,
    nameFa: row.name_fa,
    namePs: row.name_ps,
    iconSource: row.icon_source === "custom" ? "custom" : "builtin",
    iconKey: row.icon_key,
    iconUrl: row.icon_url,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

// برخلاف Policy عمومی («Public can read active service categories» — فقط ردیف‌های فعال)، پنل
// ادمین باید غیرفعال‌ها را هم ببیند تا بتواند دوباره فعال‌شان کند؛ به همین دلیل این تابع با
// supabaseAdminClient (Service Role، بدون فیلتر RLS) نوشته شده، نه با کلاینت مرورگر.
export async function getAllServiceCategoriesForAdmin(): Promise<ServiceCategory[]> {
  const { data, error } = await supabaseAdminClient
    .from("service_categories")
    .select("id, name_fa, name_ps, icon_source, icon_key, icon_url, display_order, is_active")
    .order("display_order", { ascending: true });

  if (error || !data) return [];
  return (data as RawServiceCategoryRow[]).map(mapRow);
}

// تسک ۶ فاز ۰۴ — لایه‌ی خواندنِ عمومی تخصص‌های «فعال»، برای انتخابگر تخصص در فرم ثبت/ویرایش
// پروفایل متخصص (ServiceProviderProfileClient.tsx). دقیقاً هم‌الگو با تابع بالا (همان جدول،
// همان mapRow)، با یک تفاوت عمدی: اینجا هم صریحاً `is_active = true` فیلتر می‌شود، هرچند این
// صفحه با supabaseAdminClient (که خودش RLS را دور می‌زند، نه چون به آن متکی است) خوانده می‌شود —
// دقیقاً همان دلیلی که در getActiveDrivers (فاز ۰۳) باعث شد فیلتر is_active صریحاً در کوئری/تابع
// نوشته شود، نه صرفاً به Policy عمومی «Public can read active service categories» تکیه شود؛ چون
// همه‌ی خواندن‌های این پروژه (طبق بند ۸.۴ سند راهبردی) از سمت سرور و با Service Role انجام
// می‌شوند، RLS در عمل هرگز اجرا نمی‌شود و باید فیلتر همیشه صریحاً در کد تکرار شود.
export async function getActiveServiceCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabaseAdminClient
    .from("service_categories")
    .select("id, name_fa, name_ps, icon_source, icon_key, icon_url, display_order, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) return [];
  return (data as RawServiceCategoryRow[]).map(mapRow);
}