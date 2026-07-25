"use client";
// مسیر فایل: src/app/[lang]/admin/users/UsersTable.tsx
// تسک ۲ فاز ۰۷ — بخش تعاملی «مدیریت کاربران»: هم‌الگو با
// src/app/[lang]/admin/reports/ReportsQueueTable.tsx (useTransition + بروزرسانی خوش‌بینانه‌ی
// state محلی پس از موفقیت اکشن) از نظر تعامل.
//
// **به‌روزرسانی اصلاح UX موبایل:** پیش از این یک جدول HTML خام (thead/tbody) با شش ستون بود که
// داخل overflow-x-auto قرار داشت — یعنی روی گوشی برای دیدن ستون‌های آخر (وضعیت/دکمه) باید افقی
// اسکرول می‌شد و متن/دکمه‌ها ریز و کم‌فاصله بودند. حالا دقیقاً هم‌الگو با
// ReportsQueueTable.tsx/ProvidersTable.tsx به فهرست کارتی عمودی تبدیل شده: هر کاربر یک Card با
// تمام اطلاعات به‌صورت خوانا زیر هم، و دکمه‌ی مسدودسازی/رفع مسدودی با ارتفاع حداقل ۴۸px برای لمس
// راحت. هیچ داده، منطق، یا مسیر Server Action‌ای تغییر نکرد.
//
// دکمه‌ی مسدودسازی/رفع مسدودی برای ردیف‌های role='admin' عمداً اصلاً نمایش داده نمی‌شود — هم‌سو
// با محافظت سمت سرور در actions.ts (cannotBlockAdmin/cannotBlockSelf)؛ یعنی حتی نیاز به کلیک و
// دریافت پیام خطا هم نیست، چون از همان ابتدا گزینه‌ی نامعتبر اصلاً به ادمین نشان داده نمی‌شود.
import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { setUserBlockedAction } from "./actions";
import type { AdminUserRow } from "@/lib/users/adminUserQueries";

type Dict = {
  colName: string;
  colPhone: string;
  colRole: string;
  colJoined: string;
  colStatus: string;
  noNameLabel: string;
  roleLabels: Record<string, string>;
  statusActive: string;
  statusBlocked: string;
  blockButton: string;
  unblockButton: string;
  updateError: string;
};

export function UsersTable({
  lang,
  items,
  dict,
}: {
  lang: string;
  items: AdminUserRow[];
  dict: Dict;
}) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const locale = lang === "ps" ? "fa-AF" : "fa-IR";

  function handleToggle(id: string, nextBlocked: boolean) {
    setErrorId(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await setUserBlockedAction(lang, id, nextBlocked);
      if (result.success) {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isBlocked: nextBlocked } : r))
        );
      } else {
        setErrorId(id);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const rowIsPending = isPending && pendingId === row.id;

        return (
          <Card key={row.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <Link
                  href={`/${lang}/users/${row.id}`}
                  className="font-bold text-text-main hover:text-primary hover:underline truncate"
                >
                  {row.name || dict.noNameLabel}
                </Link>
                <span className="text-sm text-text-muted" dir="ltr">
                  {row.phoneNumber}
                </span>
              </div>
              <span className="text-xs font-bold text-text-muted bg-bg-base rounded-full px-2 py-1 whitespace-nowrap shrink-0">
                {dict.roleLabels[row.role] ?? row.role}
              </span>
            </div>

            <div className="text-xs text-text-muted">
              {dict.colJoined}: {new Date(row.createdAt).toLocaleDateString(locale)}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span
                className={`font-bold text-sm ${
                  row.isBlocked ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {row.isBlocked ? dict.statusBlocked : dict.statusActive}
              </span>

              {row.role === "admin" ? null : (
                <button
                  type="button"
                  disabled={rowIsPending}
                  onClick={() => handleToggle(row.id, !row.isBlocked)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 min-h-[44px] text-sm font-bold disabled:opacity-60 transition-colors ${
                    row.isBlocked
                      ? "bg-emerald-50 text-emerald-600 active:bg-emerald-100"
                      : "bg-red-50 text-red-500 active:bg-red-100"
                  }`}
                >
                  {rowIsPending ? (
                    <Spinner
                      className="w-4 h-4"
                      label={row.isBlocked ? dict.unblockButton : dict.blockButton}
                    />
                  ) : row.isBlocked ? (
                    <Icons.UserCheck className="w-4 h-4" />
                  ) : (
                    <Icons.UserX className="w-4 h-4" />
                  )}
                  {row.isBlocked ? dict.unblockButton : dict.blockButton}
                </button>
              )}
            </div>

            {errorId === row.id && <p className="text-xs text-red-500">{dict.updateError}</p>}
          </Card>
        );
      })}
    </div>
  );
}
