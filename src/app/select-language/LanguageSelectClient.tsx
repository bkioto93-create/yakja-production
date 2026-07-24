// مسیر فایل: src/app/select-language/LanguageSelectClient.tsx
// تسک ۱ فاز ۰۱ — دو دکمه‌ی انتخاب زبان؛ هر کدام مستقیماً Server Action مربوطه را صدا می‌زند
// (نیازی به فرم یا API Route جدا نیست، طبق الگوی رایج Next.js برای Server Actions).
//
// استثنای مصرح دوم بر الزام قطعی ۲ (ممنوعیت متن هاردکد) — یافته‌ی ممیزی تسک ۹ فاز ۰۱:
// برچسب دو دکمه («دری» و «پښتو») عمداً هاردکد است، دقیقاً به همان دلیلی که در
// src/app/select-language/page.tsx مستند شده: در این نقطه هنوز هیچ زبانی انتخاب نشده،
// پس getDictionary قابل فراخوانی نیست (وابسته به locale ای است که هنوز مشخص نشده).
// ضمناً نام هر زبان به خط خودش («دری»/«پښتو») مستقل از زبان رابط کاربری است — یعنی حتی اگر
// دیکشنری در دسترس بود، این دو رشته در هر دو فایل fa.ts/ps.ts یک مقدار ثابت می‌ماندند.
// این فایل را در ممیزی «متن هاردکد» رد نکن؛ همراه با page.tsx همین پوشه، دومین و آخرین
// استثنای مصرح این الزام است.
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { setLanguage } from "./actions";
import type { Locale } from "@/lib/i18n/constants";

export function LanguageSelectClient() {
  const [pendingLang, setPendingLang] = useState<Locale | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (lang: Locale) => {
    setPendingLang(lang);
    startTransition(() => {
      setLanguage(lang);
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
      <Button
        variant="primary"
        fullWidth
        disabled={isPending}
        loading={isPending && pendingLang === "fa"}
        onClick={() => handleSelect("fa")}
      >
        دری
      </Button>
      <Button
        variant="outline"
        fullWidth
        disabled={isPending}
        loading={isPending && pendingLang === "ps"}
        onClick={() => handleSelect("ps")}
      >
        پښتو
      </Button>
    </div>
  );
}