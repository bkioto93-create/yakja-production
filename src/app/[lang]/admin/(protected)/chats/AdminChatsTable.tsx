"use client";
// مسیر فایل: src/app/[lang]/admin/(protected)/chats/AdminChatsTable.tsx
// فاز ۱۳ — بخش تعاملی «فهرست درخواست‌های چت پشتیبانی». دقیقاً هم‌الگو با
// admin/vip/VipRequestsTable.tsx: دکمه‌های عملیات با حذف خوش‌بینانه (Optimistic) از فهرست فعلی
// به‌محض موفقیت.
//
// سه حالت دکمه بسته به وضعیتِ خودِ ردیف:
// - pending: «تایید و باز کردن گفتگو» + «رد درخواست»
// - active: فقط یک لینک «باز کردن گفتگو» (به همان صفحه‌ی چت واقعیِ src/app/[lang]/chat/[id])
// - rejected: فقط «تایید و باز کردن گفتگو» (امکان تجدیدنظر مدیر)
import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { approveAdminChatRequestAction, declineAdminChatRequestAction } from "./actions";
import type { AdminChatRequestRow } from "@/lib/admin/adminChatQueries";

type Dict = {
  unknownUser: string;
  requestedAtLabel: string;
  respondedAtLabel: string;
  messagePreviewLabel: string;
  noMessageYet: string;
  approveButton: string;
  declineButton: string;
  openChatButton: string;
  updateError: string;
};

export function AdminChatsTable({
  lang,
  items,
  dict,
}: {
  lang: string;
  items: AdminChatRequestRow[];
  dict: Dict;
}) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [errorId, setErrorId] = useState<string | null>(null);

  function handleApprove(id: string) {
    setErrorId(null);
    startTransition(async () => {
      const result = await approveAdminChatRequestAction(lang, id);
      if (result.success) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErrorId(id);
      }
    });
  }

  function handleDecline(id: string) {
    setErrorId(null);
    startTransition(async () => {
      const result = await declineAdminChatRequestAction(lang, id);
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
              <span className="font-bold text-text-main truncate">{row.userName || dict.unknownUser}</span>
              {row.userPhone && (
                <span className="text-xs text-text-muted" dir="ltr">
                  {row.userPhone}
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
              {dict.requestedAtLabel}:{" "}
              {new Date(row.requestedAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")}
            </span>
          </div>

          <div className="flex items-start gap-1.5 bg-slate-50 rounded-xl px-3 py-2.5">
            <Icons.MessageSquare className="w-4 h-4 shrink-0 text-text-muted mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
              {row.lastMessagePreview ? (
                <>
                  <span className="font-bold">{dict.messagePreviewLabel}: </span>
                  {row.lastMessagePreview}
                </>
              ) : (
                dict.noMessageYet
              )}
            </p>
          </div>

          {row.respondedAt && (
            <span className="text-xs text-text-muted">
              {dict.respondedAtLabel}: {new Date(row.respondedAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")}
            </span>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {row.status === "active" ? (
              <Link href={`/${lang}/chat/${row.id}`} className="flex-1">
                <span className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white font-bold text-sm py-2.5 active:scale-95 transition-transform">
                  <Icons.MessageSquare className="w-4 h-4" />
                  {dict.openChatButton}
                </span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleApprove(row.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-white font-bold text-sm py-2.5 active:scale-95 transition-transform disabled:opacity-60"
                >
                  <Icons.CheckCircle className="w-4 h-4" />
                  {dict.approveButton}
                </button>
                {row.status === "pending" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDecline(row.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 text-red-500 font-bold text-sm py-2.5 active:scale-95 transition-transform disabled:opacity-60"
                  >
                    <Icons.X className="w-4 h-4" />
                    {dict.declineButton}
                  </button>
                )}
              </>
            )}
          </div>

          {errorId === row.id && <p className="text-xs text-red-500">{dict.updateError}</p>}
        </Card>
      ))}
    </div>
  );
}