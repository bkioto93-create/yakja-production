// مسیر فایل: src/app/[lang]/listings/page.tsx
// تسک ۷ فاز ۰۲ — نسخه‌ی نهایی فهرست/جستجوی آگهی‌های تاییدشده (جایگزین نسخه‌ی حداقلی تسک ۴).
// اولین صفحه‌ی نتایج (بدون دسته، بدون مکان کاربر، یعنی «جدیدترین‌ها») کاملاً سمت سرور خوانده
// می‌شود تا حتی پیش از اجرای جاوااسکریپت هم چیزی روی صفحه دیده شود (سازگار با اینترنت ضعیف)؛
// فیلتر دسته، جستجوی دستی شهر/منطقه، و مرتب‌سازی بر اساس نزدیک‌ترین فاصله (GPS) سپس توسط
// کامپوننت کلاینت ListingsSearch (با Server Action) انجام می‌شود.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { searchListings } from "@/lib/marketplace/queries";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ListingsSearch } from "./ListingsSearch";
import { LISTINGS_PAGE_SIZE } from "./constants";
import { getSelectedProvince } from "@/lib/province/getSelectedProvince";
import type { Locale } from "@/lib/i18n/constants";

export default async function ListingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const indexDict = dict.marketplace.index;

  // فاز ۱۰: اولین صفحه‌ی نتایج (خوانده‌شده سمت سرور) هم باید طبق ولایت انتخابی کاربر فیلتر شده
  // باشد، نه فقط جستجوهای بعدی سمت کلاینت — وگرنه بار اول همیشه سراسری نشان داده می‌شد.
  const { province } = await getSelectedProvince();

  const { items, totalCount } = await searchListings({
    province,
    limit: LISTINGS_PAGE_SIZE,
    offset: 0,
  });

  return (
    <div className="flex flex-col gap-5 px-5 md:px-0 pt-8 pb-10 max-w-lg md:max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-text-main">{indexDict.title}</h1>
        <Link href={`/${lang}/listings/new`}>
          <Button variant="primary">
            <Icons.Box className="w-5 h-5 ml-2" />
            {indexDict.postAdButton}
          </Button>
        </Link>
      </div>

      <ListingsSearch
        lang={lang as Locale}
        dict={dict.marketplace}
        provinceDict={dict.province}
        selectedProvince={province}
        initialItems={items}
        initialTotalCount={totalCount}
      />
    </div>
  );
}