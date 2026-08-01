"use client";
// مسیر فایل: src/app/[lang]/admin/(protected)/vip/VipSettingsForm.tsx
// فاز ۱۱ — بخش تعاملی «تنظیمات VIP» پنل مدیریت (بند ۸.۳ پرامپت): ویرایش قیمت اشتراک ماهانه +
// اطلاعات بانکی + اطلاعات صرافی، همه ذخیره در platform_settings — هیچ‌کدام هاردکد نیست.
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { updateVipSettingsAction } from "./actions";
import type { VipSettings } from "@/lib/vip/platformSettings";

type Dict = {
  title: string;
  priceLabel: string;
  bankLabel: string;
  exchangeLabel: string;
  saveButton: string;
  saveSuccess: string;
  saveError: string;
};

export function VipSettingsForm({
  lang,
  initialSettings,
  dict,
}: {
  lang: string;
  initialSettings: VipSettings;
  dict: Dict;
}) {
  const { showToast } = useToast();
  const [monthlyPrice, setMonthlyPrice] = useState(String(initialSettings.monthlyPrice));
  const [bankDetails, setBankDetails] = useState(initialSettings.bankDetails);
  const [exchangeDetails, setExchangeDetails] = useState(initialSettings.exchangeDetails);
  const [isSaving, startSaving] = useTransition();

  function handleSave() {
    startSaving(async () => {
      const result = await updateVipSettingsAction(lang, {
        monthlyPrice,
        bankDetails,
        exchangeDetails,
      });
      showToast(result.success ? dict.saveSuccess : dict.saveError, result.success ? "success" : "error");
    });
  }

  return (
    <Card className="p-5 flex flex-col gap-3">
      <h2 className="font-extrabold text-text-main text-sm">{dict.title}</h2>

      <Input
        label={dict.priceLabel}
        value={monthlyPrice}
        onChange={(e) => setMonthlyPrice(e.target.value.replace(/[^0-9]/g, ""))}
        inputMode="numeric"
        dir="ltr"
      />

      <div className="w-full">
        <label className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
          {dict.bankLabel}
        </label>
        <textarea
          value={bankDetails}
          onChange={(e) => setBankDetails(e.target.value)}
          rows={3}
          className="block w-full bg-bg-base border border-slate-200 text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
          {dict.exchangeLabel}
        </label>
        <textarea
          value={exchangeDetails}
          onChange={(e) => setExchangeDetails(e.target.value)}
          rows={3}
          className="block w-full bg-bg-base border border-slate-200 text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
        />
      </div>

      <Button variant="primary" fullWidth loading={isSaving} disabled={isSaving} onClick={handleSave}>
        {dict.saveButton}
      </Button>
    </Card>
  );
}