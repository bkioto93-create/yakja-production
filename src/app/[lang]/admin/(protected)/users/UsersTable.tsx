"use client";
// مسیر فایل: src/app/[lang]/admin/users/UsersTable.tsx
// تسک ۲ فاز ۰۷ — بخش تعاملی جدول «مدیریت کاربران»: دقیقاً هم‌الگو با جدول
// src/app/[lang]/admin/sms/page.tsx (ساختار table/thead/tbody) از نظر نمایش، و هم‌الگو با
// src/app/[lang]/admin/reports/ReportsQueueTable.tsx (useTransition + بروزرسانی خوش‌بینانه‌ی
// state محلی پس از موفقیت اکشن) از نظر تعامل.
//
// دکمه‌ی مسدودسازی/رفع مسدودی برای ردیف‌های role='admin' عمداً اصلاً نمایش داده نمی‌شود — هم‌سو
// با محافظت سمت سرور در actions.ts (cannotBlockAdmin/cannotBlockSelf)؛ یعنی حتی نیاز به کلیک و
// دریافت پیام خطا هم نیست، چون از همان ابتدا گزینه‌ی نامعتبر اصلاً به ادمین نشان داده نمی‌شود.
import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
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
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-base text-text-muted text-right">
              <th className="px-4 py-3 font-bold">{dict.colName}</th>
              <th className="px-4 py-3 font-bold">{dict.colPhone}</th>
              <th className="px-4 py-3 font-bold">{dict.colRole}</th>
              <th className="px-4 py-3 font-bold">{dict.colJoined}</th>
              <th className="px-4 py-3 font-bold">{dict.colStatus}</th>
              <th className="px-4 py-3 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowIsPending = isPending && pendingId === row.id;
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-text-main">
                    <Link
                      href={`/${lang}/users/${row.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.name || dict.noNameLabel}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted" dir="ltr">
                    {row.phoneNumber}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {dict.roleLabels[row.role] ?? row.role}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(row.createdAt).toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
                        row.isBlocked ? "text-red-500" : "text-emerald-600"
                      }`}
                    >
                      {row.isBlocked ? dict.statusBlocked : dict.statusActive}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.role === "admin" ? null : (
                      <button
                        type="button"
                        disabled={rowIsPending}
                        onClick={() => handleToggle(row.id, !row.isBlocked)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-60 transition-colors ${
                          row.isBlocked
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {row.isBlocked ? (
                          <Icons.UserCheck className="w-4 h-4" />
                        ) : (
                          <Icons.UserX className="w-4 h-4" />
                        )}
                        {row.isBlocked ? dict.unblockButton : dict.blockButton}
                      </button>
                    )}
                    {errorId === row.id && (
                      <p className="text-xs text-red-500 mt-1">{dict.updateError}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}