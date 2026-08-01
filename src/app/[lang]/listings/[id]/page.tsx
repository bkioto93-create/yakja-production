// مسیر فایل: src/app/[lang]/listings/[id]/page.tsx
// تسک ۶ فاز ۰۲ — صفحه‌ی جزئیات آگهی + بخش «آگهی‌های مشابه».
// آگهی‌های مشابه بر اساس همان دسته‌بندی انتخاب می‌شوند؛ اگر آگهی جاری موقعیت مکانی (GPS) داشت،
// مرتب‌سازی توسط تابع Postgres سمت دیتابیس (get_similar_listings، با PostGIS ST_Distance) انجام
// می‌شود؛ در غیر این صورت، جدیدترین آگهی‌های همان دسته نمایش داده می‌شوند (طبق تسک ۶).
// فقط آگهی‌های «تاییدشده» در این صفحه قابل مشاهده‌اند (همان قاعده‌ی RLS/RPC عمومی).
//
// تکمیل گذشته‌نگر تسک ۳ فاز ۰۶: کارت «فروشنده» اضافه شد — لینکی به پروفایل عمومی تازه‌ساخته‌شده‌ی
// فروشنده (src/app/[lang]/users/[id]/page.tsx، از روی listing.ownerId که از قبل در ListingDetail
// موجود بود). پیش از این تکمیل، هیچ راهی برای دیدن یا گزارش‌کردن پروفایل فروشنده وجود نداشت؛
// دکمه‌ی «گزارش تخلف» با target_type='user' حالا خودِ آن صفحه‌ی پروفایل قرار دارد، نه اینجا.
//
// **اصلاح ممیزی مجدد تسک ۴ فاز ۰۸:** تصویر اصلی/بزرگ گالری (eager + fetchPriority="high")
// فاقد decoding="async" بود، برخلاف توضیح مکتوب تسک ۴ («در تمام موارد بالا decoding="async" هم
// اضافه شد»). بندانگشتی‌ها و «آگهی‌های مشابه» از قبل decoding="async" داشتند؛ این تنها تصویری بود
// که جا افتاده بود. اکنون اضافه شد تا رمزگشایی این تصویر هم رندر بقیه‌ی صفحه را مسدود نکند —
// بدون هیچ تاثیری بر اولویت دانلود (fetchPriority="high" و loading="eager" دست‌نخورده ماندند).
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** ۱) VipBadge کنار عنوان آگهی، فقط اگر listing.ownerIsVip؛
// ۲) اگر آگهی ویدئوی VIP دارد (listing.videoPath)، یک پخش‌کننده‌ی <video> بعد از گالری تصاویر
// اضافه می‌شود — طبق بند ۵ پرامپت VIP («صفحه‌ی جزئیات هر آگهی کالا»).
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getApprovedListingById, getSimilarListings } from "@/lib/marketplace/queries";
import { getListingImageUrl, getListingVideoUrl } from "@/lib/marketplace/images";
import { LISTING_CATEGORIES } from "@/lib/marketplace/categories";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ReportButton } from "@/components/reports/ReportButton";
import { VipBadge } from "@/components/vip/VipBadge";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const detailDict = dict.marketplace.detail;

  const listing = await getApprovedListingById(id);

  if (!listing) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{detailDict.notFoundTitle}</h2>
          <p className="text-sm text-text-muted">{detailDict.notFoundDesc}</p>
          <Link href={`/${lang}/listings`} className="w-full">
            <Button variant="primary" fullWidth>
              {detailDict.backToListingsButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const categoryMeta = LISTING_CATEGORIES.find((c) => c.id === listing.category);
  const categoryLabel = categoryMeta
    ? dict.marketplace.categories[categoryMeta.dictKey as keyof typeof dict.marketplace.categories]
    : listing.category;
  const CategoryIcon = categoryMeta?.icon;

  const similarListings = await getSimilarListings({
    category: listing.category,
    excludeId: listing.id,
    latitude: listing.latitude,
    longitude: listing.longitude,
  });

  return (
    <div className="flex flex-col gap-5 px-4 md:px-0 pt-6 pb-10 max-w-lg md:max-w-3xl mx-auto w-full">
      <Link
        href={`/${lang}/listings`}
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
            src={getListingImageUrl(listing.images[0])}
            alt={listing.title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        {listing.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {listing.images.slice(1).map((path) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={path}
                src={getListingImageUrl(path)}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover rounded-xl"
              />
            ))}
          </div>
        )}

        {/* فاز ۱۱ — ویدئوی اختیاری VIP */}
        {listing.videoPath && (
          <video
            src={getListingVideoUrl(listing.videoPath)}
            controls
            className="w-full aspect-video rounded-2xl bg-black"
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          {CategoryIcon && <CategoryIcon className="w-5 h-5" />}
          <span>{categoryLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-text-main">{listing.title}</h1>
          {listing.ownerIsVip && <VipBadge label={dict.vip.badgeLabel} size="md" />}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-primary" dir="ltr">
            {listing.price.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-text-muted">{detailDict.currencyLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <Icons.MapPin className="w-4 h-4 shrink-0" />
          <span>{listing.address}</span>
        </div>

        <Card className="p-4 flex flex-col gap-1.5">
          <h2 className="font-bold text-text-main text-sm">{detailDict.descriptionTitle}</h2>
          <p className="text-sm text-text-muted whitespace-pre-line">
            {listing.description || detailDict.noDescription}
          </p>
        </Card>

        {/* تکمیل گذشته‌نگر تسک ۳ فاز ۰۶ — کارت «فروشنده»؛ لینک به پروفایل عمومی تازه‌ساخته‌شده. */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.User className="w-5 h-5" />
          </div>
          <span className="flex-1 text-sm font-bold text-text-main">
            {detailDict.sellerSectionTitle}
          </span>
          <Link
            href={`/${lang}/users/${listing.ownerId}`}
            className="text-xs font-bold text-primary active:opacity-70 shrink-0"
          >
            {detailDict.viewSellerProfileButton}
          </Link>
        </Card>

        <a href={`tel:${listing.contactPhone}`} className="w-full">
          <Button variant="primary" fullWidth>
            <Icons.Phone className="w-5 h-5 ml-2" />
            {detailDict.callButton}
          </Button>
        </a>

        {/* تسک ۳ فاز ۰۶ — دکمه‌ی «گزارش تخلف» روی آگهی؛ target_type = listing */}
        <ReportButton
          lang={lang}
          targetType="listing"
          targetId={listing.id}
          label={dict.reports.reportButtonLabel}
          className="self-center"
        />
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <h2 className="font-extrabold text-text-main">{detailDict.similarTitle}</h2>

        {similarListings.length === 0 ? (
          <p className="text-sm text-text-muted">{detailDict.similarEmpty}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {similarListings.map((item) => (
              <Link key={item.id} href={`/${lang}/listings/${item.id}`}>
                <Card className="flex flex-col h-full active:scale-[0.98] transition-transform">
                  <div className="w-full aspect-square bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getListingImageUrl(item.images[0])}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 flex flex-col gap-1">
                    <span className="text-sm font-bold text-text-main line-clamp-1">{item.title}</span>
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