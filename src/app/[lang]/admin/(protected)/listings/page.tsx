// مسیر فایل: src/app/[lang]/admin/listings/page.tsx
// تسک ۳ فاز ۰۷ — صفحه‌ی «تایید یا حذف آگهی‌ها». دسترسی ادمین (requireAdmin) از قبل توسط
// src/app/[lang]/admin/layout.tsx تضمین شده — دقیقاً هم‌الگو با admin/reports/page.tsx و
// admin/users/page.tsx.
//
// دو ردیف تب دارد: ردیف اول انتخاب ماژول (کالا/ملک — طبق بند ۶.۶ سند راهبردی، حمل‌ونقل و خدمات
// در این تسک نیستند؛ رجوع کنید به یادداشت پایان همین فایل)، ردیف دوم انتخاب وضعیت (در
// انتظار/تاییدشده/حذف‌شده) — هر دو با Link ساده و query string، دقیقاً هم‌رویکرد با تب‌های وضعیت
// در admin/reports/page.tsx (بدون نیاز به جاوااسکریپت، سریع‌تر روی اینترنت ضعیف طبق بند ۵.۳).
// صفحه‌بندی هم دقیقاً هم‌الگو با admin/users/page.tsx (Link به‌جای state).
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getListingsQueue } from "@/lib/marketplace/adminListingQueries";
import { getRealEstateQueue } from "@/lib/realEstate/adminRealEstateQueries";
import { ListingsQueueTable } from "./ListingsQueueTable";
import type { ListingModerationStatus, ListingModule } from "./actions";

export const dynamic = "force-dynamic";

const MODULES: ListingModule[] = ["marketplace", "realEstate"];
const STATUSES: ListingModerationStatus[] = ["pending", "approved", "deleted"];

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ module?: string; status?: string; page?: string }>;
}) {
  const { lang } = await params;
  const { module: rawModule, status: rawStatus, page: rawPage } = await searchParams;

  const activeModule: ListingModule = MODULES.includes(rawModule as ListingModule)
    ? (rawModule as ListingModule)
    : "marketplace";
  const activeStatus: ListingModerationStatus = STATUSES.includes(
    rawStatus as ListingModerationStatus
  )
    ? (rawStatus as ListingModerationStatus)
    : "pending";
  const page = Number(rawPage) > 0 ? Number(rawPage) : 1;

  const dict = await getDictionary(lang);

  const { items, totalCount, pageSize } =
    activeModule === "marketplace"
      ? await getListingsQueue({ status: activeStatus, page })
      : await getRealEstateQueue({ status: activeStatus, page });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const hrefFor = (moduleName: ListingModule, status: ListingModerationStatus, p: number) =>
    `/${lang}/admin/listings?module=${moduleName}&status=${status}&page=${p}`;

  const tableDict = {
    statusOptions: dict.admin.listings.statusOptions,
    updateError: dict.admin.listings.updateError,
    ownerLabel: dict.admin.listings.ownerLabel,
    unknownOwner: dict.admin.listings.unknownOwner,
    currencyLabel: dict.admin.listings.currencyLabel,
    categories: dict.marketplace.categories,
    propertyTypes: dict.realEstate.propertyTypes,
    dealTypes: dict.realEstate.dealTypes,
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-extrabold text-lg text-text-main">{dict.admin.listings.title}</h1>
        <p className="text-sm text-text-muted">{dict.admin.listings.subtitle}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {MODULES.map((moduleName) => (
          <Link
            key={moduleName}
            href={hrefFor(moduleName, activeStatus, 1)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 ${
              activeModule === moduleName
                ? "bg-primary text-white"
                : "text-text-muted bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {dict.admin.listings.moduleLabels[moduleName]}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100 pb-2">
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={hrefFor(activeModule, status, 1)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 ${
              activeStatus === status
                ? "bg-primary text-white"
                : "text-text-muted bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {dict.admin.listings.statusOptions[status]}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-10">{dict.admin.listings.empty}</p>
      ) : (
        <ListingsQueueTable lang={lang} module={activeModule} items={items} dict={tableDict} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={hrefFor(activeModule, activeStatus, p)}
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

// یادداشت طراحی (بند ۶.۶ سند راهبردی می‌گوید «تایید یا حذف آگهی‌ها در تمام بخش‌ها — کالا،
// حمل‌ونقل، خدمات، املاک»): در دیتابیس فعلی، فقط جدول‌های listings و real_estate ستون
// status (pending/approved/deleted) دارند (طبق تسک ۲/۹ فاز ۰۲ و تسک ۲/۷ فاز ۰۵) — یعنی فقط این
// دو ماژول اصلاً یک «صفِ در-انتظار-تایید» برای بررسی دارند. جدول‌های drivers/service_providers
// چنین وضعیتی ندارند؛ راننده/متخصص با ثبت پروفایل بلافاصله در فهرست عمومی دیده می‌شود (فقط سوییچ
// is_active خودش را کنترل می‌کند، طبق بند ۶.۲/۶.۳ سند راهبردی) و مدیریت اختصاصی آن دو، طبق ترتیب
// همین فاز، موضوع تسک ۵ («ساخت بخش مدیریت اختصاصی رانندگان و متخصصین فنی») است، نه این تسک. اگر
// کارفرما در تسک ۵ نیاز به یک مکانیزم تایید مشابه برای راننده/متخصص هم داشته باشد، آن‌جا با یک
// ستون/تصمیم جداگانه بررسی خواهد شد.
