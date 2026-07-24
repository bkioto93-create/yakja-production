// مسیر فایل: src/app/[lang]/transport/page.tsx
// تسک ۸ فاز ۰۳ — صفحه‌ی اصلی ماژول حمل‌ونقل: فهرست رانندگان «فعال»، مرتب‌شده بر اساس نزدیک‌ترین
// فاصله (در صورت دادن GPS) یا آخرین به‌روزرسانی موقعیت. اولین صفحه‌ی نتایج (بدون مکان کاربر)
// کاملاً سمت سرور خوانده می‌شود، دقیقاً هم‌الگو با src/app/[lang]/listings/page.tsx (فاز ۰۲، تسک ۷).
// این صفحه هم‌زمان اولین‌بار مسیر /{lang}/transport را (که از تسک ۱ همین فاز در ناوبری بالا/پایین
// صفحه لینک شده بود ولی هنوز page.tsx نداشت) می‌سازد.
//
// **رفع خطای Build:** DRIVERS_PAGE_SIZE دیگر از actions.ts (فایل "use server") ایمپورت
// نمی‌شود، بلکه از constants.ts می‌آید.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getActiveDrivers } from "@/lib/transport/driverQueries";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ActiveDriversList } from "./ActiveDriversList";
import { DRIVERS_PAGE_SIZE } from "./constants";

export default async function TransportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const listDict = dict.transport.list;

  const { items, totalCount } = await getActiveDrivers({ limit: DRIVERS_PAGE_SIZE, offset: 0 });

  return (
    <div className="flex flex-col gap-5 px-5 md:px-0 pt-8 pb-10 max-w-lg md:max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-text-main">{listDict.title}</h1>
        <Link href={`/${lang}/transport/driver`}>
          <Button variant="primary">
            <Icons.Truck className="w-5 h-5 ml-2" />
            {listDict.becomeDriverButton}
          </Button>
        </Link>
      </div>
      <p className="text-sm text-text-muted -mt-3">{listDict.subtitle}</p>

      <ActiveDriversList
        lang={lang}
        dict={listDict}
        reportButtonLabel={dict.reports.reportButtonLabel}
        vehicleTypesDict={dict.transport.vehicleTypes}
        initialItems={items}
        initialTotalCount={totalCount}
      />
    </div>
  );
}