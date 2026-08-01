// مسیر فایل: src/app/[lang]/services/page.tsx
// تسک ۷ فاز ۰۴ — صفحه‌ی اصلی ماژول خدمات: فهرست/جستجوی متخصصینِ مرتبط با تخصص‌های «فعال»،
// مرتب‌شده بر اساس نزدیک‌ترین فاصله (در صورت دادن GPS) یا بدون فاصله. اولین صفحه‌ی نتایج (بدون
// فیلتر تخصص، بدون مکان کاربر) کاملاً سمت سرور خوانده می‌شود، دقیقاً هم‌الگو با
// src/app/[lang]/listings/page.tsx (فاز ۰۲، تسک ۷) و src/app/[lang]/transport/page.tsx (فاز ۰۳،
// تسک ۸).
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** vipBadgeLabel به ActiveServiceProvidersList پاس داده می‌شود.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getActiveServiceCategories } from "@/lib/services/serviceCategories";
import { getActiveServiceProviders } from "@/lib/services/serviceProviderQueries";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ActiveServiceProvidersList } from "./ActiveServiceProvidersList";
import { SERVICE_PROVIDERS_PAGE_SIZE } from "./constants";
import { getSelectedProvince } from "@/lib/province/getSelectedProvince";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const listDict = dict.services.list;

  // فاز ۱۰: اولین صفحه‌ی نتایج هم باید طبق ولایت انتخابی کاربر فیلتر شده باشد.
  const { province } = await getSelectedProvince();

  const [categories, { items, totalCount }] = await Promise.all([
    getActiveServiceCategories(),
    getActiveServiceProviders({ province, limit: SERVICE_PROVIDERS_PAGE_SIZE, offset: 0 }),
  ]);

  return (
    <div className="flex flex-col gap-5 px-5 md:px-0 pt-8 pb-10 max-w-lg md:max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-text-main">{listDict.title}</h1>
        <Link href={`/${lang}/services/provider`}>
          <Button variant="primary">
            <Icons.Wrench className="w-5 h-5 ml-2" />
            {listDict.becomeProviderButton}
          </Button>
        </Link>
      </div>
      <p className="text-sm text-text-muted -mt-3">{listDict.subtitle}</p>

      <ActiveServiceProvidersList
        lang={lang}
        dict={listDict}
        reportButtonLabel={dict.reports.reportButtonLabel}
        vipBadgeLabel={dict.vip.badgeLabel}
        categories={categories}
        provinceDict={dict.province}
        selectedProvince={province}
        initialItems={items}
        initialTotalCount={totalCount}
      />
    </div>
  );
}