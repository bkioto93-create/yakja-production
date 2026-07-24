// مسیر فایل: src/app/[lang]/admin/reports/page.tsx
// تسک ۵ فاز ۰۶ (معادل تسک ۴ فاز ۰۷) — صفحه‌ی «صف بررسی گزارش‌های تخلف».
// دسترسی ادمین (requireAdmin) از قبل توسط src/app/[lang]/admin/layout.tsx تضمین شده — دقیقاً
// هم‌الگو با src/app/[lang]/admin/services/page.tsx.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getReportsQueue, type ReportStatus } from "@/lib/reports/adminReportQueries";
import { ReportsQueueTable } from "./ReportsQueueTable";

const TABS: ReportStatus[] = ["pending", "reviewed", "resolved"];

export default async function AdminReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { lang } = await params;
  const { status: rawStatus } = await searchParams;
  const activeStatus: ReportStatus = TABS.includes(rawStatus as ReportStatus)
    ? (rawStatus as ReportStatus)
    : "pending";

  const dict = await getDictionary(lang);
  const items = await getReportsQueue(activeStatus);

  const tableDict = {
    ...dict.admin.reports,
    reasons: dict.reports.newPage.reasons,
    vehicleTypes: dict.transport.vehicleTypes,
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-extrabold text-lg text-text-main">{dict.admin.reports.title}</h1>
        <p className="text-sm text-text-muted">{dict.admin.reports.subtitle}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/${lang}/admin/reports?status=${tab}`}
            className={`px-3 py-1.5 rounded-full text-sm font-bold ${
              activeStatus === tab
                ? "bg-primary text-white"
                : "text-text-muted bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {dict.admin.reports.statusOptions[tab]}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-10">{dict.admin.reports.empty}</p>
      ) : (
        <ReportsQueueTable lang={lang} items={items} dict={tableDict} />
      )}
    </div>
  );
}