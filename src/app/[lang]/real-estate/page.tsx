// مسیر فایل: src/app/[lang]/real-estate/page.tsx
// تسک ۶ فاز ۰۵ — نسخه‌ی نهایی فهرست/جستجوی آگهی‌های ملکِ تاییدشده، دقیقاً هم‌الگو با
// src/app/[lang]/listings/page.tsx (فاز ۰۲، تسک ۷).
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** vipBadgeLabel به RealEstateSearch پاس داده می‌شود.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { searchRealEstate } from "@/lib/realEstate/queries";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { RealEstateSearch } from "./RealEstateSearch";
import { REAL_ESTATE_PAGE_SIZE } from "./constants";
import { getSelectedProvince } from "@/lib/province/getSelectedProvince";
import type { Locale } from "@/lib/i18n/constants";

export default async function RealEstatePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const indexDict = dict.realEstate.index;

  // فاز ۱۰: اولین صفحه‌ی نتایج هم باید طبق ولایت انتخابی کاربر فیلتر شده باشد.
  const { province } = await getSelectedProvince();

  const { items, totalCount } = await searchRealEstate({
    province,
    limit: REAL_ESTATE_PAGE_SIZE,
    offset: 0,
  });

  return (
    <div className="flex flex-col gap-5 px-5 md:px-0 pt-8 pb-10 max-w-lg md:max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-text-main">{indexDict.title}</h1>
        <Link href={`/${lang}/real-estate/new`}>
          <Button variant="primary">
            <Icons.Home className="w-5 h-5 ml-2" />
            {indexDict.postAdButton}
          </Button>
        </Link>
      </div>

      <RealEstateSearch
        lang={lang as Locale}
        dict={dict.realEstate}
        provinceDict={dict.province}
        vipBadgeLabel={dict.vip.badgeLabel}
        selectedProvince={province}
        initialItems={items}
        initialTotalCount={totalCount}
      />
    </div>
  );
}