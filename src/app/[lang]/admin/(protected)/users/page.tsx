// مسیر فایل: src/app/[lang]/admin/users/page.tsx
// تسک ۲ فاز ۰۷ — صفحه‌ی «مدیریت کاربران» پنل ادمین.
// دسترسی ادمین (requireAdmin) از قبل توسط src/app/[lang]/admin/layout.tsx تضمین شده — دقیقاً
// هم‌الگو با src/app/[lang]/admin/reports/page.tsx و src/app/[lang]/admin/services/page.tsx.
//
// جستجو عمداً با یک فرم HTML ساده و متد GET پیاده‌سازی شده (نه یک کامپوننت کلاینت با
// useRouter/debounce): این‌طور صفحه بدون هیچ جاوااسکریپتی هم کار می‌کند و روی اینترنت ضعیف
// (بند ۵.۳ سند راهبردی) سریع‌تر بارگذاری می‌شود؛ دقیقاً هم‌رویکرد با تب‌های وضعیت در
// src/app/[lang]/admin/reports/page.tsx که با Link ساده (نه state) کار می‌کنند.
//
// **به‌روزرسانی — گردش تایید عکس پروفایل:** یک ردیف تب تازه (همه/در انتظار/تاییدشده/ردشده) برای
// فیلترکردن بر اساس وضعیت عکس اضافه شد — دقیقاً هم‌الگو با تب‌های وضعیت در
// admin/listings/page.tsx (query string، بدون جاوااسکریپت). پیش‌فرض «همه» است (نه «در انتظار»)
// چون برخلاف صفِ آگهی‌ها، بیشتر کاربران اصلاً عکسی آپلود نمی‌کنند — نگه‌داشتن رفتار پیش‌فرض فعلی
// (نمایش همه‌ی کاربران) برای ادمینی که فقط دنبال یک کاربر خاص می‌گردد مهم‌تر است؛ تب «در انتظار
// تایید» همیشه در دسترس است تا هر وقت خواست، مستقیم به صفِ بررسی برود.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getUsersPage, type AdminUserPhotoStatus } from "@/lib/users/adminUserQueries";
import { UsersTable } from "./UsersTable";

export const dynamic = "force-dynamic";

const PHOTO_STATUS_TABS: Array<AdminUserPhotoStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
];

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; page?: string; photoStatus?: string }>;
}) {
  const { lang } = await params;
  const { q, page: rawPage, photoStatus: rawPhotoStatus } = await searchParams;
  const search = q?.trim() || "";
  const page = Number(rawPage) > 0 ? Number(rawPage) : 1;
  const activePhotoStatus: AdminUserPhotoStatus | "all" = PHOTO_STATUS_TABS.includes(
    rawPhotoStatus as AdminUserPhotoStatus
  )
    ? (rawPhotoStatus as AdminUserPhotoStatus)
    : "all";

  const dict = await getDictionary(lang);
  const { items, totalCount, pageSize } = await getUsersPage({
    search,
    page,
    photoStatus: activePhotoStatus,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pageHref = (p: number, photoStatus: AdminUserPhotoStatus | "all" = activePhotoStatus) =>
    `/${lang}/admin/users?${search ? `q=${encodeURIComponent(search)}&` : ""}photoStatus=${photoStatus}&page=${p}`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-extrabold text-lg text-text-main">{dict.admin.users.title}</h1>
        <p className="text-sm text-text-muted">{dict.admin.users.subtitle}</p>
      </div>

      <form action={`/${lang}/admin/users`} method="get" className="flex gap-2">
        <input type="hidden" name="photoStatus" value={activePhotoStatus} />
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder={dict.admin.users.searchPlaceholder}
          className="flex-1 min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="submit"
          className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-bold active:scale-95 transition-all"
        >
          {dict.admin.users.searchButton}
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100 pb-2">
        {PHOTO_STATUS_TABS.map((status) => (
          <Link
            key={status}
            href={pageHref(1, status)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 ${
              activePhotoStatus === status
                ? "bg-primary text-white"
                : "text-text-muted bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {dict.admin.users.photoStatusTabs[status]}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-10">{dict.admin.users.empty}</p>
      ) : (
        <UsersTable lang={lang} items={items} dict={dict.admin.users} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-bold ${
                p === page ? "bg-primary text-white" : "bg-slate-50 text-text-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}