// مسیر فایل: src/app/[lang]/vip/VipPurchaseClient.tsx
// فاز ۱۱ — بخش تعاملی صفحه‌ی VIP: انتخاب روش پرداخت (بانک/صرافی)، نمایش اطلاعات همان روش
// (خوانده‌شده از platform_settings، نه هاردکد)، فیلد اختیاری «توضیح تکمیلی/کد رهگیری»، و ثبت
// نهایی درخواست — دقیقاً طبق جریان ۸ مرحله‌ای بند ۲ پرامپت VIP.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/ToastProvider";
import { createVipRequestAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";
import type { VipSettings } from "@/lib/vip/platformSettings";
import type { MyVipRequest } from "@/lib/vip/vipQueries";

type Dict = Awaited<ReturnType<typeof getDictionary>>;
type PaymentMethod = "bank" | "exchange";

export function VipPurchaseClient({
  lang,
  dict,
  isVip,
  vipExpiresAt,
  settings,
  latestRequest,
}: {
  lang: Locale;
  dict: Dict;
  isVip: boolean;
  vipExpiresAt: string | null;
  settings: VipSettings;
  latestRequest: MyVipRequest | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const vipDict = dict.vip;
  // رفع خطای بیلد TypeScript: vipDict.form.errors یک شکل ثابت (unauthenticated/invalidPaymentMethod/...)
  // دارد، ولی result.error از نوع string عمومی است؛ بدون این cast، ایندکس‌کردن با یک string عمومی
  // خطای ts(2345) می‌دهد — دقیقاً همان الگوی errorsDict که در بقیه‌ی فرم‌های پروژه (مثل
  // NewListingWizard.tsx) از قبل استفاده شده بود؛ اینجا از قلم افتاده بود.
  const errorsDict = vipDict.form.errors as Record<string, string>;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, startSubmitting] = useTransition();

  const hasPendingRequest = latestRequest?.status === "pending";

  function handleSubmit() {
    if (!paymentMethod) {
      showToast(vipDict.form.selectMethodError, "error");
      return;
    }
    startSubmitting(async () => {
      const result = await createVipRequestAction(lang, paymentMethod, note);
      if (!result.success) {
        showToast(errorsDict[result.error] ?? errorsDict.generic, "error");
        return;
      }
      showToast(vipDict.form.submitSuccess, "success");
      router.push(`/${lang}/profile`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* وضعیت فعلی VIP کاربر — اگر همین حالا فعال است */}
      {isVip && vipExpiresAt && (
        <Card className="p-4 flex items-center gap-3 bg-emerald-50 border-emerald-100">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <Icons.CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-emerald-700">
            {vipDict.form.currentlyVipUntil.replace(
              "{date}",
              new Date(vipExpiresAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")
            )}
          </p>
        </Card>
      )}

      {/* اگر یک درخواست «در انتظار بررسی» باز دارد، فرم پنهان و فقط این کارت نشان داده می‌شود */}
      {hasPendingRequest ? (
        <Card className="p-5 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center">
            <Icons.MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-text-main">{vipDict.form.pendingTitle}</h2>
          <p className="text-sm text-text-muted">{vipDict.form.pendingDesc}</p>
        </Card>
      ) : (
        <>
          {latestRequest?.status === "rejected" && (
            <Card className="p-4 flex flex-col gap-1 bg-red-50 border-red-100">
              <p className="text-sm font-bold text-red-600">{vipDict.form.rejectedNotice}</p>
              {latestRequest.rejectionReason && (
                <p className="text-xs text-red-500">
                  {vipDict.form.rejectionReasonLabel}: {latestRequest.rejectionReason}
                </p>
              )}
            </Card>
          )}

          <Card className="p-4 flex flex-col gap-3">
            <h2 className="font-extrabold text-text-main text-sm">
              {isVip ? vipDict.form.renewTitle : vipDict.form.requestTitle}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  paymentMethod === "bank"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-text-main"
                }`}
              >
                <Icons.CheckCircle className="w-6 h-6" />
                <span className="text-sm font-bold">{vipDict.form.paymentMethodBank}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("exchange")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  paymentMethod === "exchange"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-text-main"
                }`}
              >
                <Icons.Box className="w-6 h-6" />
                <span className="text-sm font-bold">{vipDict.form.paymentMethodExchange}</span>
              </button>
            </div>

            {paymentMethod && (
              <div className="bg-bg-base rounded-2xl p-4 text-sm text-text-main whitespace-pre-line">
                {paymentMethod === "bank" ? settings.bankDetails : settings.exchangeDetails}
              </div>
            )}

            {paymentMethod && (
              <div className="w-full">
                <label className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
                  {vipDict.form.noteLabel}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={vipDict.form.notePlaceholder}
                  rows={2}
                  className="block w-full bg-bg-base border border-slate-200 text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted resize-none"
                />
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || !paymentMethod}
              onClick={handleSubmit}
            >
              {vipDict.form.submitButton}
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}