// مسیر فایل: src/app/[lang]/HomeShowcaseBanners.tsx
// تسک بازطراحی صفحه‌ی اصلی — چهار بنر «پیش‌رونده‌ی افقی» که کارفرما صریحاً درخواست کرده بود:
// «راننده‌های جدید که ثبت‌نام می‌کنن رو عکس و اسمشون و وسیله‌شون رو توی بنر افقی نمایش بدیم،
// متخصصین جدید رو هم، ملک‌های جدید و آگهی‌های فروش جدید رو هم».
//
// کاملاً Server Component است (بدون "use client")، چون هیچ تعامل کاربری‌ای لازم ندارد — فقط
// اسکرول افقی خام با overflow-x-auto + scroll-snap که خودِ مرورگر بدون هیچ جاوااسکریپتی
// انجامش می‌دهد. داده‌ها را والد (page.tsx) از src/lib/home/homeQueries.ts می‌گیرد و این‌جا فقط
// prop دریافت می‌کند — یعنی هیچ فراخوانی دیتابیسی در همین فایل نیست.
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { Card } from "@/components/ui/Card";
import { getDriverImageUrl } from "@/lib/transport/images";
import { getServiceProviderImageUrl } from "@/lib/services/images";
import { getListingImageUrl } from "@/lib/marketplace/images";
import { getRealEstateImageUrl } from "@/lib/realEstate/images";
import { VEHICLE_TYPES } from "@/lib/transport/vehicleTypes";
import { LISTING_CATEGORIES } from "@/lib/marketplace/categories";
import { PROPERTY_TYPES } from "@/lib/realEstate/propertyTypes";
import { DEAL_TYPES } from "@/lib/realEstate/dealTypes";
import { getBuiltinIconComponent } from "@/lib/services/serviceCategoryIcons";
import type {
  HomeDriverPreview,
  HomeProviderPreview,
} from "@/lib/home/homeQueries";
import type { ListingSummary } from "@/lib/marketplace/queries";
import type { RealEstateSummary } from "@/lib/realEstate/queries";

// نوع دیکشنری هر بخش (title/subtitle/viewAll/emptyText) — دقیقاً هم‌شکل با
// dict.home.sections.drivers / providers / listings / realEstate در fa.ts و ps.ts.
type SectionDict = {
  title: string;
  subtitle: string;
  viewAll: string;
  emptyText: string;
};

function SectionHeader({ dict, href }: { dict: SectionDict; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 md:px-0 mb-3">
      <div className="min-w-0">
        <h2 className="font-extrabold text-lg text-text-main">{dict.title}</h2>
        <p className="text-sm text-text-muted truncate">{dict.subtitle}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 flex items-center gap-1 text-sm font-bold text-primary whitespace-nowrap"
      >
        {dict.viewAll}
        <Icons.ArrowRight className="w-4 h-4 rotate-180" />
      </Link>
    </div>
  );
}

function EmptyRow({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <div className="px-4 md:px-0">
      <Card className="p-6 flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm text-text-muted">{text}</p>
      </Card>
    </div>
  );
}

function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 md:px-0 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

function PreviewAvatar({
  imagePath,
  getUrl,
  fallbackIcon,
}: {
  imagePath: string | undefined;
  getUrl: (path: string) => string;
  fallbackIcon: React.ReactNode;
}) {
  return (
    <div className="w-full aspect-square rounded-2xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
      {imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getUrl(imagePath)}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        fallbackIcon
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// بنر رانندگان تازه
// ---------------------------------------------------------------------------
export function DriversShowcase({
  items,
  dict,
  memberFallbackLabel,
  vehicleTypeLabels,
  lang,
}: {
  items: HomeDriverPreview[];
  dict: SectionDict;
  memberFallbackLabel: string;
  vehicleTypeLabels: Record<string, string>;
  lang: string;
}) {
  return (
    <section>
      <SectionHeader dict={dict} href={`/${lang}/transport`} />
      {items.length === 0 ? (
        <EmptyRow text={dict.emptyText} icon={<Icons.Truck className="w-6 h-6" />} />
      ) : (
        <ScrollRow>
          {items.map((driver) => {
            const vehicle = VEHICLE_TYPES.find((v) => v.id === driver.vehicleType);
            const VehicleIcon = vehicle?.icon ?? Icons.Truck;
            return (
              <Link
                key={driver.id}
                href={`/${lang}/transport`}
                className="w-36 shrink-0 snap-start"
              >
                <Card className="p-3 flex flex-col gap-2 h-full">
                  <PreviewAvatar
                    imagePath={driver.images[0]}
                    getUrl={getDriverImageUrl}
                    fallbackIcon={<VehicleIcon className="w-8 h-8" />}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text-main truncate">
                      {driver.ownerName || memberFallbackLabel}
                    </p>
                    <p className="text-xs text-text-muted flex items-center gap-1 truncate">
                      <VehicleIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {vehicle ? vehicleTypeLabels[vehicle.dictKey] : driver.vehicleType}
                      </span>
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </ScrollRow>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// بنر متخصصین تازه
// ---------------------------------------------------------------------------
export function ProvidersShowcase({
  items,
  dict,
  memberFallbackLabel,
  lang,
}: {
  items: HomeProviderPreview[];
  dict: SectionDict;
  memberFallbackLabel: string;
  lang: string;
}) {
  return (
    <section>
      <SectionHeader dict={dict} href={`/${lang}/services`} />
      {items.length === 0 ? (
        <EmptyRow text={dict.emptyText} icon={<Icons.Wrench className="w-6 h-6" />} />
      ) : (
        <ScrollRow>
          {items.map((provider) => {
            const BuiltinIcon =
              provider.categoryIconSource === "builtin"
                ? getBuiltinIconComponent(provider.categoryIconKey)
                : null;
            const categoryName =
              lang === "ps" ? provider.categoryNamePs : provider.categoryNameFa;
            const fallbackIcon =
              provider.categoryIconSource === "custom" && provider.categoryIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.categoryIconUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-8 h-8 object-contain"
                />
              ) : BuiltinIcon ? (
                <BuiltinIcon className="w-8 h-8" />
              ) : (
                <Icons.Wrench className="w-8 h-8" />
              );

            return (
              <Link
                key={provider.id}
                href={`/${lang}/services`}
                className="w-36 shrink-0 snap-start"
              >
                <Card className="p-3 flex flex-col gap-2 h-full">
                  <PreviewAvatar
                    imagePath={provider.images[0]}
                    getUrl={getServiceProviderImageUrl}
                    fallbackIcon={fallbackIcon}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text-main truncate">
                      {provider.ownerName || memberFallbackLabel}
                    </p>
                    <p className="text-xs text-text-muted truncate">{categoryName}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </ScrollRow>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// بنر آگهی‌های تازه‌ی کالا
// ---------------------------------------------------------------------------
export function ListingsShowcase({
  items,
  dict,
  currencyLabel,
  categoryLabels,
  lang,
}: {
  items: ListingSummary[];
  dict: SectionDict;
  currencyLabel: string;
  categoryLabels: Record<string, string>;
  lang: string;
}) {
  return (
    <section>
      <SectionHeader dict={dict} href={`/${lang}/listings`} />
      {items.length === 0 ? (
        <EmptyRow text={dict.emptyText} icon={<Icons.Box className="w-6 h-6" />} />
      ) : (
        <ScrollRow>
          {items.map((listing) => {
            const category = LISTING_CATEGORIES.find((c) => c.id === listing.category);
            const CategoryIcon = category?.icon ?? Icons.CategoryOther;
            return (
              <Link
                key={listing.id}
                href={`/${lang}/listings/${listing.id}`}
                className="w-40 shrink-0 snap-start"
              >
                <Card className="p-3 flex flex-col gap-2 h-full">
                  <PreviewAvatar
                    imagePath={listing.images[0]}
                    getUrl={getListingImageUrl}
                    fallbackIcon={<CategoryIcon className="w-8 h-8" />}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text-main truncate">{listing.title}</p>
                    <p className="text-xs text-text-muted truncate">
                      {category ? categoryLabels[category.dictKey] : listing.category}
                    </p>
                    <p className="text-sm font-extrabold text-primary" dir="ltr">
                      {listing.price.toLocaleString()}{" "}
                      <span className="text-xs font-bold text-text-muted">{currencyLabel}</span>
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </ScrollRow>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// بنر آگهی‌های تازه‌ی ملک
// ---------------------------------------------------------------------------
export function RealEstateShowcase({
  items,
  dict,
  currencyLabel,
  propertyTypeLabels,
  dealTypeLabels,
  lang,
}: {
  items: RealEstateSummary[];
  dict: SectionDict;
  currencyLabel: string;
  propertyTypeLabels: Record<string, string>;
  dealTypeLabels: Record<string, string>;
  lang: string;
}) {
  return (
    <section>
      <SectionHeader dict={dict} href={`/${lang}/real-estate`} />
      {items.length === 0 ? (
        <EmptyRow text={dict.emptyText} icon={<Icons.PropertyHouseSale className="w-6 h-6" />} />
      ) : (
        <ScrollRow>
          {items.map((property) => {
            const propertyType = PROPERTY_TYPES.find((p) => p.id === property.propertyType);
            const dealType = DEAL_TYPES.find((d) => d.id === property.dealType);
            const PropertyIcon = propertyType?.icon ?? Icons.PropertyHouseSale;
            return (
              <Link
                key={property.id}
                href={`/${lang}/real-estate/${property.id}`}
                className="w-40 shrink-0 snap-start"
              >
                <Card className="p-3 flex flex-col gap-2 h-full">
                  <PreviewAvatar
                    imagePath={property.images[0]}
                    getUrl={getRealEstateImageUrl}
                    fallbackIcon={<PropertyIcon className="w-8 h-8" />}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text-main truncate">
                      {propertyType ? propertyTypeLabels[propertyType.dictKey] : property.propertyType}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {dealType ? dealTypeLabels[dealType.dictKey] : property.dealType}
                    </p>
                    <p className="text-sm font-extrabold text-primary" dir="ltr">
                      {property.price.toLocaleString()}{" "}
                      <span className="text-xs font-bold text-text-muted">{currencyLabel}</span>
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </ScrollRow>
      )}
    </section>
  );
}
