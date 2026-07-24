// مسیر فایل: src/app/[lang]/admin/providers/page.tsx
// تسک ۵ فاز ۰۷ — صفحه‌ی «مدیریت اختصاصی رانندگان و متخصصین فنی». دسترسی ادمین (requireAdmin) از
// قبل توسط src/app/[lang]/admin/layout.tsx تضمین شده — دقیقاً هم‌الگو با admin/users/page.tsx و
// admin/listings/page.tsx.
//
// یک ردیف تب دارد: انتخاب ماژول (رانندگان/متخصصین)، با Link و query string — دقیقاً همان الگوی
// تب‌های ماژول در admin/listings/page.tsx (بدون نیاز به جاوااسکریپت، سریع‌تر روی اینترنت ضعیف
// طبق بند ۵.۳ سند راهبردی). برخلاف admin/listings/page.tsx، اینجا تب وضعیت وجود ندارد چون فقط
// دو وضعیت (فعال/غیرفعال) هست که مستقیماً با سوییچ هر ردیف تغییر می‌کند، نه با یک select چندگزینه‌ای
// مثل status آگهی‌ها.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getDriversPage } from "@/lib/transport/adminDriverQueries";
import { getServiceProvidersPage } from "@/lib/services/adminServiceProviderQueries";
import { ProvidersTable, type ProvidersModule } from "./ProvidersTable";

export const dynamic = "force-dynamic";

const MODULES: ProvidersModule[] = ["drivers", "services"];

export default async function AdminProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ module?: string; q?: string; page?: string }>;
}) {
  const { lang } = await params;
  const { module: rawModule, q, page: rawPage } = await searchParams;

  const activeModule: ProvidersModule = MODULES.includes(rawModule as ProvidersModule)
    ? (rawModule as ProvidersModule)
    : "drivers";
  const search = q?.trim() || "";
  const page = Number(rawPage) > 0 ? Number(rawPage) : 1;

  const dict = await getDictionary(lang);

  const { items, totalCount, pageSize } =
    activeModule === "drivers"
      ? await getDriversPage({ search, page })
      : await getServiceProvidersPage({ search, page });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const hrefFor = (moduleName: ProvidersModule, p: number) =>
    `/${lang}/admin/providers?module=${moduleName}${search ? `&q=${encodeURIComponent(search)}` : ""}&page=${p}`;

  const tableDict = {
    ownerLabel: dict.admin.providers.ownerLabel,
    unknownOwner: dict.admin.providers.unknownOwner,
    statusActive: dict.admin.providers.statusActive,
    statusInactive: dict.admin.providers.statusInactive,
    updateError: dict.admin.providers.updateError,
    vehicleTypes: dict.transport.vehicleTypes,
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-extrabold text-lg text-text-main">{dict.admin.providers.title}</h1>
        <p className="text-sm text-text-muted">{dict.admin.providers.subtitle}</p>
      </div>

      <div className="flex gap-2">
        {MODULES.map((moduleName) => (
          <Link
            key={moduleName}
            href={hrefFor(moduleName, 1)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold ${
              activeModule === moduleName
                ? "bg-primary text-white"
                : "text-text-muted bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {dict.admin.providers.moduleLabels[moduleName]}
          </Link>
        ))}
      </div>

      <form action={`/${lang}/admin/providers`} method="get" className="flex gap-2">
        <input type="hidden" name="module" value={activeModule} />
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder={dict.admin.providers.searchPlaceholder}
          className="flex-1 min-h-[48px] bg-white border border-slate-200 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="submit"
          className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-bold active:scale-95 transition-all"
        >
          {dict.admin.providers.searchButton}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-10">{dict.admin.providers.empty}</p>
      ) : (
        <ProvidersTable lang={lang} module={activeModule} items={items} dict={tableDict} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={hrefFor(activeModule, p)}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-bold ${
                p === page ? "bg-primary text-white" : "bg-slate-50 text-text-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}