// مسیر فایل: src/app/[lang]/real-estate/[id]/page.tsx
// تسک ۶ فاز ۰۵ — صفحه‌ی جزئیات آگهی ملک + بخش «آگهی‌های مشابه»، دقیقاً هم‌الگو با
// src/app/[lang]/listings/[id]/page.tsx (فاز ۰۲، تسک ۶).
// آگهی‌های مشابه بر اساس همان نوع ملک و همان نوع معامله انتخاب می‌شوند؛ اگر آگهی جاری موقعیت
// مکانی (GPS) داشت، مرتب‌سازی توسط تابع Postgres سمت دیتابیس (get_similar_real_estate، با
// PostGIS ST_Distance) انجام می‌شود؛ در غیر این صورت، جدیدترین آگهی‌های همان نوع/معامله نمایش
// داده می‌شوند. فقط آگهی‌های «تاییدشده» در این صفحه قابل مشاهده‌اند.
//
// تفاوت با ماژول کالا: real_estate ستون title ندارد، پس تیتر صفحه از روی نوع ملک ساخته می‌شود؛
// شماره تماس هم برخلاف listings در خودِ ردیف آگهی ذخیره نشده — از get_real_estate_detail (Join
// با users) خوانده می‌شود.
//
// تکمیل گذشته‌نگر تسک ۳ فاز ۰۶: کارت «آگهی‌دهنده» اضافه شد — لینکی به پروفایل عمومی
// تازه‌ساخته‌شده‌ی آگهی‌دهنده.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** ۱) VipBadge کنار تیتر آگهی، فقط اگر property.ownerIsVip؛
// ۲) اگر آگهی ویدئوی VIP دارد (property.videoPath)، یک پخش‌کننده‌ی <video> بعد از گالری تصاویر
// اضافه می‌شود.
//
// **به‌روزرسانی فاز ۱۲ (چت):** دکمه‌ی «چت با آگهی‌دهنده» کنار دکمه‌ی تماس اضافه شد.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getApprovedRealEstateById, getSimilarRealEstate } from "@/lib/realEstate/queries";
import { getRealEstateImageUrl, getRealEstateVideoUrl } from "@/lib/realEstate/images";
import { PROPERTY_TYPES } from "@/lib/realEstate/propertyTypes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ReportButton } from "@/components/reports/ReportButton";
import { VipBadge } from "@/components/vip/VipBadge";
import { ChatButton } from "@/components/chat/ChatButton";
import type { Locale } from "@/lib/i18n/constants";

export default async function RealEstateDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const detailDict = dict.realEstate.detail;
  const propertyTypesDict = dict.realEstate.propertyTypes as Record<string, string>;
  const dealTypesDict = dict.realEstate.dealTypes as Record<string, string>;
  const viewer = await getCurrentUser();

  const property = await getApprovedRealEstateById(id);

  if (!property) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{detailDict.notFoundTitle}</h2>
          <p className="text-sm text-text-muted">{detailDict.notFoundDesc}</p>
          <Link href={`/${lang}/real-estate`} className="w-full">
            <Button variant="primary" fullWidth>
              {detailDict.backToListingsButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const propertyTypeMeta = PROPERTY_TYPES.find((p) => p.id === property.propertyType);
  const propertyTypeLabel = propertyTypeMeta
    ? propertyTypesDict[propertyTypeMeta.dictKey]
    : property.propertyType;
  const dealTypeLabel = dealTypesDict[property.dealType] ?? property.dealType;
  const PropertyIcon = propertyTypeMeta?.icon;

  const similarProperties = await getSimilarRealEstate({
    propertyType: property.propertyType,
    dealType: property.dealType,
    excludeId: property.id,
    latitude: property.latitude,
    longitude: property.longitude,
  });

  return (
    <div className="flex flex-col gap-5 px-4 md:px-0 pt-6 pb-10 max-w-lg md:max-w-3xl mx-auto w-full">
      <Link
        href={`/${lang}/real-estate`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted w-fit active:opacity-70"
      >
        <Icons.ArrowRight className="w-4 h-4" />
        {detailDict.backButton}
      </Link>

      {/* گالری تصاویر: تصویر اصلی + بندانگشتی‌های بقیه (طبق ۱ تا ۵ عکس تسک ۲) */}
      <div className="flex flex-col gap-2">
        <div className="w-full aspect-square md:aspect-video rounded-2xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getRealEstateImageUrl(property.images[0])}
            alt={propertyTypeLabel}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        {property.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {property.images.slice(1).map((path) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={path}
                src={getRealEstateImageUrl(path)}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover rounded-xl"
              />
            ))}
          </div>
        )}

        {/* فاز ۱۱ — ویدئوی اختیاری VIP */}
        {property.videoPath && (
          <video
            src={getRealEstateVideoUrl(property.videoPath)}
            controls
            className="w-full aspect-video rounded-2xl bg-black"
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          {PropertyIcon && <PropertyIcon className="w-5 h-5" />}
          <span>{propertyTypeLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-text-main">
            {propertyTypeLabel} · {dealTypeLabel}
          </h1>
          {property.ownerIsVip && <VipBadge label={dict.vip.badgeLabel} size="md" />}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-primary" dir="ltr">
            {property.price.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-text-muted">{detailDict.currencyLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <Icons.MapPin className="w-4 h-4 shrink-0" />
          <span>{property.address}</span>
        </div>

        <Card className="p-4 flex flex-col gap-1.5">
          <h2 className="font-bold text-text-main text-sm">{detailDict.descriptionTitle}</h2>
          <p className="text-sm text-text-muted whitespace-pre-line">
            {property.description || detailDict.noDescription}
          </p>
        </Card>

        {/* تکمیل گذشته‌نگر تسک ۳ فاز ۰۶ — کارت «آگهی‌دهنده»؛ لینک به پروفایل عمومی تازه‌ساخته‌شده. */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.User className="w-5 h-5" />
          </div>
          <span className="flex-1 text-sm font-bold text-text-main">
            {detailDict.ownerSectionTitle}
          </span>
          <Link
            href={`/${lang}/users/${property.ownerId}`}
            className="text-xs font-bold text-primary active:opacity-70 shrink-0"
          >
            {detailDict.viewOwnerProfileButton}
          </Link>
        </Card>

        <a href={`tel:${property.contactPhone}`} className="w-full">
          <Button variant="primary" fullWidth>
            <Icons.Phone className="w-5 h-5 ml-2" />
            {detailDict.callButton}
          </Button>
        </a>

        {/* فاز ۱۲ — دکمه‌ی «چت با آگهی‌دهنده» */}
        <ChatButton
          lang={lang as Locale}
          viewerId={viewer?.id ?? null}
          contextType="real_estate"
          contextId={property.id}
          ownerId={property.ownerId}
          dict={dict.chat.button}
          fullWidth
        />

        {/* تسک ۳ فاز ۰۶ — دکمه‌ی «گزارش تخلف» روی آگهی ملک؛ target_type = real_estate */}
        <ReportButton
          lang={lang}
          targetType="real_estate"
          targetId={property.id}
          label={dict.reports.reportButtonLabel}
          className="self-center"
        />
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <h2 className="font-extrabold text-text-main">{detailDict.similarTitle}</h2>

        {similarProperties.length === 0 ? (
          <p className="text-sm text-text-muted">{detailDict.similarEmpty}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {similarProperties.map((item) => (
              <Link key={item.id} href={`/${lang}/real-estate/${item.id}`}>
                <Card className="flex flex-col h-full active:scale-[0.98] transition-transform">
                  <div className="w-full aspect-square bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getRealEstateImageUrl(item.images[0])}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 flex flex-col gap-1">
                    <span className="text-sm font-extrabold text-primary" dir="ltr">
                      {item.price.toLocaleString()}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}