"use client";
// مسیر فایل: src/app/[lang]/admin/reports/ReportsQueueTable.tsx
// تسک ۵ فاز ۰۶ (معادل تسک ۴ فاز ۰۷) — بخش تعاملی صف بررسی گزارش‌ها.
//
// ترجمه‌ی برچسب «مورد گزارش‌شده» دقیقاً همین‌جا انجام می‌شود، نه در adminReportQueries.ts:
// - راننده: targetLabel خام (مثلاً "taxi") با dict.transport.vehicleTypes ترجمه می‌شود.
// - بقیه (آگهی/ملک/کاربر/متخصص): targetLabel از قبل متن قابل‌نمایش است (عنوان/آدرس/نام/نام تخصص).
import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { updateReportStatusAction } from "./actions";
import type { AdminReportRow, ReportStatus } from "@/lib/reports/adminReportQueries";
import { REPORT_REASONS } from "@/lib/reports/reasons";

// نگاشتِ مقدار خامِ دیتابیسِ reports.reason (snake_case، مثل «inappropriate_content») به
// dictKey متناظرش (camelCase، مثل «inappropriateContent») — تک‌نقطه‌ی حقیقت همان
// REPORT_REASONS در reasons.ts است، پس این نگاشت هرگز از آن آرایه جدا/ناهم‌سو نمی‌شود.
// رفع باگ ممیزی i18n تسک ۷: پیش از این، dict.reasons مستقیماً با row.reason (snake_case)
// ایندکس می‌شد، اما کلیدهای dict.reports.newPage.reasons camelCase‌اند؛ برای «کلاهبرداری»/«سایر»
// (که تک‌کلمه‌اند و id با dictKey یکی است) تصادفاً کار می‌کرد، اما برای «محتوای نامناسب»/«آگهی
// جعلی» (dictKey چندکلمه‌ای دارند) مقدار undefined برمی‌گشت و برچسب دلیل در پنل ادمین خالی می‌ماند.
const REASON_DICT_KEY: Record<string, string> = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.id, r.dictKey])
);

type Dict = {
  targetMissing: string;
  targetTypes: Record<string, string>;
  reasonLabel: string;
  reasons: Record<string, string>;
  reporterLabel: string;
  unknownReporter: string;
  statusOptions: Record<ReportStatus, string>;
  updateError: string;
  vehicleTypes: Record<string, string>;
};

// مسیر عمومی هر نوع هدف برای لینک‌دهی؛ راننده/متخصص عمداً null‌اند چون صفحه‌ی عمومی مجزا برای
// یک راننده/متخصص خاص در اپ وجود ندارد (فقط فهرست فعال‌ها).
const TARGET_LINK_PREFIX: Partial<Record<string, string>> = {
  listing: "listings",
  real_estate: "real-estate",
  user: "users",
};

export function ReportsQueueTable({
  lang,
  items,
  dict,
}: {
  lang: string;
  items: AdminReportRow[];
  dict: Dict;
}) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [errorId, setErrorId] = useState<string | null>(null);

  function handleStatusChange(id: string, status: ReportStatus) {
    setErrorId(null);
    startTransition(async () => {
      const result = await updateReportStatusAction(lang, id, status);
      if (result.success) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErrorId(id);
      }
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const linkPrefix = TARGET_LINK_PREFIX[row.targetType];
        const displayLabel =
          row.targetType === "driver" && row.targetLabel
            ? dict.vehicleTypes[row.targetLabel] ?? row.targetLabel
            : row.targetLabel;

        return (
          <Card key={row.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="inline-flex w-fit items-center gap-1 text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {dict.targetTypes[row.targetType]}
                </span>
                {displayLabel && linkPrefix ? (
                  <Link
                    href={`/${lang}/${linkPrefix}/${row.targetId}`}
                    className="font-bold text-text-main hover:text-primary underline"
                  >
                    {displayLabel}
                  </Link>
                ) : displayLabel ? (
                  <span className="font-bold text-text-main">{displayLabel}</span>
                ) : (
                  <span className="text-sm text-text-muted italic">{dict.targetMissing}</span>
                )}
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {new Date(row.createdAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")}
              </span>
            </div>

            <div className="text-sm">
              <span className="font-bold text-text-main">{dict.reasonLabel}: </span>
              <span className="text-text-muted">{dict.reasons[REASON_DICT_KEY[row.reason]]}</span>
            </div>

            {row.description && (
              <p className="text-sm text-text-muted bg-slate-50 rounded-lg p-2">
                {row.description}
              </p>
            )}

            <div className="text-sm text-text-muted">
              {dict.reporterLabel}: {row.reporterName || dict.unknownReporter}
              {row.reporterPhone ? ` (${row.reporterPhone})` : ""}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Icons.Flag className="w-4 h-4 text-text-muted shrink-0" />
              <select
                defaultValue={row.status}
                disabled={isPending}
                onChange={(e) => handleStatusChange(row.id, e.target.value as ReportStatus)}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold bg-white"
              >
                {(Object.keys(dict.statusOptions) as ReportStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {dict.statusOptions[s]}
                  </option>
                ))}
              </select>
            </div>

            {errorId === row.id && <p className="text-xs text-red-500">{dict.updateError}</p>}
          </Card>
        );
      })}
    </div>
  );
}