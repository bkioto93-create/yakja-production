// مسیر فایل: src/app/[lang]/admin/(protected)/vip/page.tsx
// فاز ۱۱ — صفحه‌ی «اشتراک VIP» پنل مدیریت (بند ۸ پرامپت VIP). دسترسی ادمین از قبل توسط
// src/app/[lang]/admin/(protected)/layout.tsx تضمین شده — دقیقاً هم‌الگو با admin/listings/page.tsx.
//
// سه بخش: ۱) تب‌های وضعیت درخواست (در انتظار/تاییدشده/ردشده) با صفحه‌بندی — همان الگوی Link +
// query string ادمین/آگهی‌ها؛ ۲) فرم تنظیمات VIP؛ ۳) فهرست «کاربران VIP فعال» (پیشنهادی، بند
// ۸.۴ پرامپت).
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getVipRequestsPage, getActiveVipUsers } from "@/lib/vip/adminVipQueries";
import { getVipSettings } from "@/lib/vip/platformSettings";
import { VipRequestsTable } from "./VipRequestsTable";
import { VipSettingsForm } from "./VipSettingsForm";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import type { VipRequestStatus } from "@/lib/vip/vipQueries";

export const dynamic = "force-dynamic";

const STATUSES: VipRequestStatus[] = ["pending", "approved", "rejected"];

export default async function AdminVipPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { lang } = await params;
  const { status: rawStatus, page: rawPage } = await searchParams;

  const activeStatus: VipRequestStatus = STATUSES.includes(rawStatus as VipRequestStatus)
    ? (rawStatus as VipRequestStatus)
    : "pending";
  const page = Number(rawPage) > 0 ? Number(rawPage) : 1;

  const dict = await getDictionary(lang);
  const adminVipDict = dict.admin.vip;

  const [{ items, totalCount, pageSize }, settings, activeVipUsers] = await Promise.all([
    getVipRequestsPage({ status: activeStatus, page }),
    getVipSettings(),
    getActiveVipUsers(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hrefFor = (status: VipRequestStatus, p: number) =>
    `/${lang}/admin/vip?status=${status}&page=${p}`;

  const tableDict = {
    paymentMethodBank: adminVipDict.paymentMethodBank,
    paymentMethodExchange: adminVipDict.paymentMethodExchange,
    unknownOwner: adminVipDict.unknownOwner,
    noteLabel: adminVipDict.noteLabel,
    approveButton: adminVipDict.approveButton,
    rejectButton: adminVipDict.rejectButton,
    rejectReasonPrompt: adminVipDict.rejectReasonPrompt,
    updateError: adminVipDict.updateError,
    requestedAtLabel: adminVipDict.requestedAtLabel,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-extrabold text-lg text-text-main">{adminVipDict.title}</h1>
        <p className="text-sm text-text-muted">{adminVipDict.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100 pb-2">
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={hrefFor(status, 1)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 ${
                activeStatus === status
                  ? "bg-primary text-white"
                  : "text-text-muted bg-slate-50 hover:bg-slate-100"
              }`}
            >
              {adminVipDict.statusLabels[status]}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-10">{adminVipDict.empty}</p>
        ) : (
          <VipRequestsTable
            lang={lang}
            items={items}
            dict={tableDict}
            showActions={activeStatus === "pending"}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={hrefFor(activeStatus, p)}
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

      <VipSettingsForm
        lang={lang}
        initialSettings={settings}
        dict={{
          title: adminVipDict.settings.title,
          priceLabel: adminVipDict.settings.priceLabel,
          bankLabel: adminVipDict.settings.bankLabel,
          exchangeLabel: adminVipDict.settings.exchangeLabel,
          saveButton: adminVipDict.settings.saveButton,
          saveSuccess: adminVipDict.settings.saveSuccess,
          saveError: adminVipDict.settings.saveError,
        }}
      />

      {/* فهرست «کاربران VIP فعال» — پیشنهادی طبق بند ۸.۴ پرامپت، برای دید کلی کارفرما */}
      <div className="flex flex-col gap-3">
        <h2 className="font-extrabold text-text-main text-sm">{adminVipDict.activeUsersTitle}</h2>
        {activeVipUsers.length === 0 ? (
          <p className="text-sm text-text-muted">{adminVipDict.activeUsersEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeVipUsers.map((u) => (
              <Card key={u.id} className="p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
                  <Icons.CheckCircle className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-bold text-text-main truncate">
                    {u.name || adminVipDict.unknownOwner}
                  </span>
                  <span className="text-xs text-text-muted" dir="ltr">
                    {u.phoneNumber}
                  </span>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                  {adminVipDict.expiresAtLabel}:{" "}
                  {new Date(u.vipExpiresAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}