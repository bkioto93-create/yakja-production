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
//
// **بازطراحی موبایل (Premium Enterprise / Dark Mode):** روی موبایل، این نوار حالا بخشی از یک
// «نوار بالای اپ»ِ تیره (هم‌تم با بنر برند، رنگ #0B1121) است که هم انتخابگر ولایت و هم زنگوله‌ی
// اعلان را کنار هم جای می‌دهد. این نوار `sticky top-0` است — برخلاف زنگوله‌ی شناورِ قبلی که
// `fixed` بود و روی محتوا می‌افتاد، نوارِ `sticky` فضای خودش را در چیدمان می‌گیرد و هرگز جلوی
// محتوا را نمی‌گیرد. زنگوله از طریق prop به‌نام `mobileEndSlot` به این نوار پاس داده می‌شود
// (سمت چپِ نوار در RTL). حالتِ دسکتاپ دقیقاً مثل قبل است: همان نوارِ کامل‌عرضِ روشن.
"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { ProvincePickerModal, type ProvinceDict } from "@/components/province/ProvincePickerModal";
import { setProvinceAction } from "@/lib/province/actions";
import { ALL_PROVINCES_VALUE } from "@/lib/province/constants";

export function ProvinceBar({
  initialProvince,
  hasChosenInitially,
  dict,
  mobileEndSlot,
}: {
  initialProvince: string | null;
  hasChosenInitially: boolean;
  dict: ProvinceDict;
  // محتوایی که در انتهای «نوار بالای موبایلِ تیره» نشانده می‌شود (زنگوله‌ی اعلان). فقط روی
  // موبایل دیده می‌شود؛ روی دسکتاپ اصلاً رندر نمی‌شود (دسکتاپ زنگوله‌ی خودش را در DesktopHeader
  // دارد).
  mobileEndSlot?: ReactNode;
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
      {/* ───────── دسکتاپ (md به‌بالا): همان نوارِ کامل‌عرضِ روشنِ قبلی، بدون هیچ تغییری ───────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="hidden md:flex w-full items-center justify-center gap-1.5 bg-primary/5 text-primary border-b border-primary/10 h-10 text-[13px] font-bold active:bg-primary/10 transition-colors disabled:opacity-60"
      >
        <Icons.MapPin className="w-4 h-4" />
        <span>{currentLabel}</span>
        <Icons.ChevronDown className="w-3.5 h-3.5" />
      </button>

      {/* ───────── موبایل (زیر md): نوار بالای اپِ تیره و چسبان (ولایت + زنگوله) ───────── */}
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-[#0B1121] px-3 h-14 shadow-[0_6px_24px_-12px_rgba(0,0,0,0.7)]">
        {/* انتخابگر ولایت — چیپِ کشیده، هم‌تم با نوار تیره */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isPending}
          className="flex-1 min-w-0 flex items-center gap-1.5 bg-white/10 text-white/95 rounded-full h-10 px-4 text-[13px] font-bold active:bg-white/15 transition-colors disabled:opacity-60"
        >
          <Icons.MapPin className="w-4 h-4 shrink-0 text-primary" />
          <span className="truncate">{currentLabel}</span>
          <Icons.ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
        </button>

        {/* زنگوله‌ی اعلان (فقط اگر کاربر واردشده باشد؛ از layout پاس داده می‌شود) */}
        {mobileEndSlot}
      </div>

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