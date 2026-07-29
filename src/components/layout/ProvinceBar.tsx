// مسیر فایل: src/components/layout/ProvinceBar.tsx
// فاز ۱۰ — نوار سراسری «ولایت جاری»، در src/app/[lang]/layout.tsx رندر می‌شود تا در همه‌ی
// صفحه‌ها (موبایل و دسکتاپ) یک‌جا دیده شود — دقیقاً همان جایگاه UX که در دیوار «شهر انتخابی» بالای
// هر صفحه پیدا است. دقیقاً هم‌الگو با DisclaimerModal (src/components/layout/DisclaimerModal.tsx):
// وضعیت «انتخاب‌شده یا نه» سمت سرور از روی کوکی خوانده و به این کامپوننت داده می‌شود؛ اگر کاربر
// هنوز هیچ ولایتی انتخاب نکرده (hasChosenInitially=false)، مودال به‌صورت خودکار در اولین بازدید
// باز می‌شود.
//
// بعد از انتخاب: کوکی توسط setProvinceAction ثبت می‌شود، سپس router.refresh() صدا زده می‌شود تا
// تمام Server Component های صفحه‌ی جاری (که province را از کوکی می‌خوانند — مثلاً لیست آگهی‌ها)
// با مقدار تازه دوباره از سرور رندر شوند، بدون تغییر آدرس URL (برخلاف سوییچ زبان که چون بخشی از
// مسیر URL است، نیاز به redirect کامل دارد).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { ProvincePickerModal, type ProvinceDict } from "@/components/province/ProvincePickerModal";
import { setProvinceAction } from "@/lib/province/actions";
import { ALL_PROVINCES_VALUE } from "@/lib/province/constants";

export function ProvinceBar({
  initialProvince,
  hasChosenInitially,
  dict,
}: {
  initialProvince: string | null;
  hasChosenInitially: boolean;
  dict: ProvinceDict;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!hasChosenInitially);
  const [currentProvince, setCurrentProvince] = useState<string | null>(initialProvince);
  const [isPending, startTransition] = useTransition();

  const currentLabel = currentProvince ? dict.names[currentProvince] : dict.allProvincesOption;

  function handleSelect(id: string) {
    setIsOpen(false);
    setCurrentProvince(id === ALL_PROVINCES_VALUE ? null : id);
    startTransition(async () => {
      await setProvinceAction(id);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-1.5 bg-primary/5 text-primary border-b border-primary/10 h-10 text-[13px] font-bold active:bg-primary/10 transition-colors disabled:opacity-60"
      >
        <Icons.MapPin className="w-4 h-4" />
        <span>{currentLabel}</span>
        <Icons.ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <ProvincePickerModal
          value={currentProvince}
          allowAll
          dict={dict}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}