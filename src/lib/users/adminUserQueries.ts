// مسیر فایل: src/lib/users/adminUserQueries.ts
// تسک ۲ فاز ۰۷ — لایه‌ی خواندنِ «مدیریت کاربران» در پنل ادمین (بند ۶.۶ سند راهبردی: «مدیریت
// کاربران (مشاهده، مسدودسازی/رفع مسدودی حساب‌های متخلف)»).
//
// هیچ ستون جدیدی برای این تسک لازم نبود: name/phone_number/role/is_blocked/created_at از قبل
// روی جدول users موجودند (role/is_blocked از فاز ۰۱ برای جریان OTP، name/phone_number از همان
// فاز برای ثبت خودکار کاربر تازه). پس این تسک هیچ دستور دیتابیسی جدیدی همراه ندارد.
//
// دقیقاً هم‌الگو با getReportsQueue (فاز ۰۶/۰۷، تسک ۴/۵): فقط ستون‌های لازم خوانده می‌شوند،
// جدیدترین کاربران اول. برخلاف آن فایل، اینجا صفحه‌بندی واقعی (limit/offset) لازم است چون تعداد
// کل کاربران برخلاف صف گزارش‌ها می‌تواند خیلی بزرگ شود.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export type AdminUserRow = {
  id: string;
  name: string | null;
  phoneNumber: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
};

export const ADMIN_USERS_PAGE_SIZE = 20;

// کاراکترهایی که در نحوی فیلتر `.or(...)` کتابخانه‌ی supabase-js معنای خاص دارند (کاما = جداکننده‌ی
// شرط‌ها، درصد = عملگر ilike) از عبارت جستجو حذف می‌شوند تا جستجوی کاربر هرگز باعث شکستن یا
// تغییر رفتار کوئری نشود.
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[%,]/g, "").trim();
}

// فهرست صفحه‌بندی‌شده‌ی کاربران برای جدول پنل ادمین؛ اگر search داده شود، هم روی name و هم روی
// phone_number جستجو می‌شود (کاربری که اسمش را فراموش کرده، اغلب فقط شماره را به‌خاطر دارد).
export async function getUsersPage(params: {
  search?: string;
  page?: number;
}): Promise<{ items: AdminUserRow[]; totalCount: number; pageSize: number }> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const from = (page - 1) * ADMIN_USERS_PAGE_SIZE;
  const to = from + ADMIN_USERS_PAGE_SIZE - 1;

  let query = supabaseAdminClient
    .from("users")
    .select("id, name, phone_number, role, is_blocked, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = params.search ? sanitizeSearchTerm(params.search) : "";
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { items: [], totalCount: 0, pageSize: ADMIN_USERS_PAGE_SIZE };
  }

  return {
    items: data.map((row) => ({
      id: row.id as string,
      name: row.name as string | null,
      phoneNumber: row.phone_number as string,
      role: row.role as string,
      isBlocked: row.is_blocked as boolean,
      createdAt: row.created_at as string,
    })),
    totalCount: count ?? 0,
    pageSize: ADMIN_USERS_PAGE_SIZE,
  };
}