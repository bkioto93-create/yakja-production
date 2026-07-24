// مسیر فایل: src/app/select-language/page.tsx
// تسک ۱ فاز ۰۱ — این صفحه فقط زمانی نمایش داده می‌شود که src/proxy.ts هیچ کوکی زبانی
// (yakja_lang) برای کاربر پیدا نکند. عمداً بیرون از app/[lang] قرار دارد چون در این نقطه
// هنوز مشخص نیست کاربر کدام زبان را می‌خواهد، پس نمی‌توان از getDictionary استفاده کرد.
//
// استثنای آگاهانه بر الزام قطعی ۲ (ممنوعیت متن هاردکد): متن این صفحه عمداً هم‌زمان
// دری و پشتو را نشان می‌دهد. لطفاً این فایل را در ممیزی «متن هاردکد» (تسک ۹ فاز ۰۱) رد نکنید.
import Image from "next/image";
import { LanguageSelectClient } from "./LanguageSelectClient";

export default function SelectLanguagePage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 text-center gap-10 bg-bg-base">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/icons/yakja-icon-192.png"
          alt="یکجا"
          width={84}
          height={84}
          priority
          className="rounded-[22px] shadow-lg shadow-primary/20"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-text-main">یکجا</h1>
          <p className="text-sm font-medium text-text-muted">
            زبان خود را انتخاب کنید — خپله ژبه غوره کړئ
          </p>
        </div>
      </div>

      <LanguageSelectClient />
    </div>
  );
}
