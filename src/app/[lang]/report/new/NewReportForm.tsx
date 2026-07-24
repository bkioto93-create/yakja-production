// مسیر فایل: src/app/[lang]/report/new/NewReportForm.tsx
// تسک ۴ فاز ۰۶ — بخش تعاملی فرم ثبت گزارش تخلف: انتخابگر دلیل (با آیکون) + فیلد توضیح آزاد
// اختیاری. دقیقاً هم‌رویکرد با src/app/[lang]/services/provider/ServiceProviderProfileClient.tsx
// (فاز ۰۴، تسک ۶): یک فرم تک‌صفحه‌ای ساده (نه Stepper)، چون تعداد فیلدها کم است و هیچ آپلود
// عکسی در کار نیست. از همان IconCategoryPicker مشترک (فاز ۰۰-ب) برای انتخاب دلیل استفاده شد.
//
// برخلاف فرم پروفایل متخصص/راننده (که موفقیت را با router.refresh ادامه‌ی همان صفحه نشان
// می‌دهند)، اینجا پس از ثبت موفق، به‌جای فرم یک کارت «تشکر/ثبت شد» جایگزین می‌شود — چون ثبت گزارش
// یک اقدام یک‌بارمصرف است، نه پروفایلی که کاربر قرار است دوباره ویرایش کند؛ نمایش دوباره‌ی فرم
// خالی پس از ارسال موفق می‌توانست باعث ارسال تصادفی گزارش تکراری شود.
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { IconCategoryPicker } from "@/components/ui/IconCategoryPicker";
import { useToast } from "@/components/ui/ToastProvider";
import { REPORT_REASONS } from "@/lib/reports/reasons";
import type { ReportTargetType } from "@/lib/reports/reportTargets";
import { createReportAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

export function NewReportForm({
  lang,
  dict,
  targetType,
  targetId,
}: {
  lang: string;
  dict: Dict;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const { showToast } = useToast();
  const pageDict = dict.reports.newPage;
  const reasonsDict = pageDict.reasons as Record<string, string>;
  const errorsDict = pageDict.errors as Record<string, string>;

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, startSubmitting] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  function handleSubmit() {
    if (!reason) {
      showToast(errorText("invalidReason"), "error");
      return;
    }

    startSubmitting(async () => {
      const result = await createReportAction({
        targetType,
        targetId,
        reason,
        description,
      });

      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }

      setIsSubmitted(true);
    });
  }

  if (isSubmitted) {
    return (
      <Card className="p-6 flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Icons.CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-text-main">{pageDict.successTitle}</h2>
        <p className="text-sm text-text-muted">{pageDict.successDesc}</p>
        <Link href={`/${lang}`} className="w-full">
          <Button variant="primary" fullWidth>
            {pageDict.successButton}
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-main text-center">{pageDict.reasonSectionTitle}</h2>
        <IconCategoryPicker
          options={REPORT_REASONS.map((r) => ({
            id: r.id,
            label: reasonsDict[r.dictKey],
            icon: <r.icon className="w-8 h-8" />,
          }))}
          value={reason}
          onChange={setReason}
        />
      </div>

      <Card className="p-5 flex flex-col">
        <div className="w-full">
          <label className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
            {pageDict.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={pageDict.descriptionPlaceholder}
            rows={4}
            className="block w-full bg-bg-base border border-slate-200 text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted resize-none"
          />
        </div>
      </Card>

      <div className="flex items-start gap-3 bg-bg-base rounded-2xl p-4">
        <Icons.Info className="w-5 h-5 shrink-0 text-text-muted mt-0.5" />
        <p className="text-sm text-text-muted">{pageDict.noPunitiveNotice}</p>
      </div>

      <Button
        variant="primary"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting || !reason}
        onClick={handleSubmit}
      >
        {pageDict.submitButton}
      </Button>
    </div>
  );
}