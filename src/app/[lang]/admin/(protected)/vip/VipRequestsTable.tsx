"use client";
// مسیر فایل: src/app/[lang]/admin/(protected)/vip/VipRequestsTable.tsx
// فاز ۱۱ — بخش تعاملی «فهرست درخواست‌های VIP» (بند ۸.۱ پرامپت). دقیقاً هم‌الگو با
// admin/reports/ReportsQueueTable.tsx: دکمه‌های «تایید»/«رد» با حذف خوش‌بینانه (Optimistic) از
// فهرست فعلی به‌محض موفقیت. دکمه‌ی «رد» یک پرامپت کوتاه برای دلیل رد باز می‌کند (اختیاری).
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { approveVipRequestAction, rejectVipRequestAction } from "./actions";
import type { AdminVipRequestRow } from "@/lib/vip/adminVipQueries";

type Dict = {
  paymentMethodBank: string;
  paymentMethodExchange: string;
  unknownOwner: string;
  noteLabel: string;
  approveButton: string;
  rejectButton: string;
  rejectReasonPrompt: string;
  updateError: string;
  requestedAtLabel: string;
};

export function VipRequestsTable({
  lang,
  items,
  dict,
  showActions,
}: {
  lang: string;
  items: AdminVipRequestRow[];
  dict: Dict;
  showActions: boolean;
}) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [errorId, setErrorId] = useState<string | null>(null);

  function handleApprove(id: string) {
    setErrorId(null);
    startTransition(async () => {
      const result = await approveVipRequestAction(lang, id);
      if (result.success) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErrorId(id);
      }
    });
  }

  function handleReject(id: string) {
    const reason = window.prompt(dict.rejectReasonPrompt) ?? "";
    setErrorId(null);
    startTransition(async () => {
      const result = await rejectVipRequestAction(lang, id, reason);
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
      {rows.map((row) => (
        <Card key={row.id} className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold text-text-main truncate">
                {row.userName || dict.unknownOwner}
              </span>
              {row.userPhone && (
                <span className="text-xs text-text-muted" dir="ltr">
                  {row.userPhone}
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
              {new Date(row.requestedAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")}
            </span>
          </div>

          <span className="inline-flex w-fit items-center gap-1 text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1">
            {row.paymentMethod === "bank" ? dict.paymentMethodBank : dict.paymentMethodExchange}
          </span>

          {row.note && (
            <p className="text-xs text-text-muted">
              {dict.noteLabel}: {row.note}
            </p>
          )}

          {row.rejectionReason && (
            <p className="text-xs text-red-500">{row.rejectionReason}</p>
          )}

          {showActions && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleApprove(row.id)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-white font-bold text-sm py-2.5 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Icons.CheckCircle className="w-4 h-4" />
                {dict.approveButton}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReject(row.id)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 text-red-500 font-bold text-sm py-2.5 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Icons.X className="w-4 h-4" />
                {dict.rejectButton}
              </button>
            </div>
          )}

          {errorId === row.id && <p className="text-xs text-red-500">{dict.updateError}</p>}
        </Card>
      ))}
    </div>
  );
}