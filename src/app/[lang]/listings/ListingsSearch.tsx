// مسیر فایل: src/app/[lang]/listings/ListingsSearch.tsx
// تسک ۷ فاز ۰۲ — بخش تعاملی صفحه‌ی فهرست آگهی‌ها: فیلتر دسته‌بندی (چیپ‌های آیکون‌دار)، دکمه‌ی
// «نمایش نزدیک‌ترین‌ها» (GPS، اختیاری)، و جستجوی دستی متنی با نام شهر/منطقه که همیشه در دسترس
// است — چه GPS داده شود چه رد شود (دقیقاً طبق متن تسک ۷). هر تغییری در دسته/متن جستجو/مختصات با
// یک تاخیر کوتاه (ضددستپاچگی تایپ) و از طریق Server Action «searchListingsAction» یک جستجوی تازه
// می‌سازد؛ صفحه‌بندی با دکمه‌ی «نمایش موارد بیشتر» (نه اسکرول بی‌نهایت خودکار) انجام می‌شود تا
// روی اینترنت ۲G/۳G مصرف داده کاملاً زیر کنترل کاربر بماند.
//
// **به‌روزرسانی UX (چیپ‌های دسته‌بندی):** هم‌راستا با تغییری که در صفحه‌ی خدمات
// (src/app/[lang]/services/ActiveServiceProvidersList.tsx) انجام شد، چیپ‌های دسته‌بندی از حالت
// اسکرول افقی تک‌ردیفه (overflow-x-auto) به چیدمان چندردیفه‌ی «wrap» تغییر کردند — با اسکرول
// افقی بخشی از دسته‌ها همیشه بیرون از دید کاربر می‌ماند و او باید حدس می‌زد باید کنار بکشد. در
// چیدمان جدید همه‌ی دسته‌ها همزمان و بدون نیاز به هیچ تعامل اضافه (نه اسکرول، نه دراپ‌داون) قابل
// مشاهده و لمس هستند.
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { LISTING_CATEGORIES } from "@/lib/marketplace/categories";
import { getListingImageUrl } from "@/lib/marketplace/images";
import { searchListingsAction } from "./actions";
import type { ListingSummary } from "@/lib/marketplace/queries";
import type { Locale } from "@/lib/i18n/constants";

type MarketplaceDict = {
  categories: Record<string, string>;
  index: Record<string, string>;
};

type LocationStatus = "idle" | "locating" | "granted" | "denied";

const SEARCH_DEBOUNCE_MS = 400;

export function ListingsSearch({
  lang,
  dict,
  initialItems,
  initialTotalCount,
}: {
  lang: Locale;
  dict: MarketplaceDict;
  initialItems: ListingSummary[];
  initialTotalCount: number;
}) {
  const indexDict = dict.index;
  const categoriesDict = dict.categories;

  const [category, setCategory] = useState<string | null>(null);
  const [queryText, setQueryText] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [items, setItems] = useState<ListingSummary[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const isFirstRun = useRef(true);

  function runSearch(offset: number, append: boolean) {
    const requestId = ++requestIdRef.current;
    startTransition(async () => {
      const result = await searchListingsAction({
        category,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        query: queryText,
        offset,
      });
      // اگر کاربر فیلتر را دوباره عوض کرده باشد، نتیجه‌ی این درخواستِ قدیمی نادیده گرفته می‌شود
      // تا وضعیتِ مسابقه‌ی درخواست‌ها (Race Condition) رخ ندهد.
      if (requestId !== requestIdRef.current) return;
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setTotalCount(result.totalCount);
    });
  }

  // جستجوی مجدد هر بار که دسته، متن جستجو، یا مختصات مکانی تغییر کند — با تاخیر کوتاه برای متن
  // جستجو تا هر ضربه‌ی کیبورد یک درخواست جداگانه نسازد. اولین اجرا (mount) عمداً رد می‌شود چون
  // نتیجه‌ی همان حالت پیش‌فرض از قبل توسط سرور (page.tsx) آورده شده.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(0, false);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, queryText, coords]);

  function handleUseMyLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("granted");
      },
      () => {
        // رد دسترسی یا خطای دیگر GPS — طبق تسک ۷، کاربر همچنان می‌تواند با جستجوی دستی متنی
        // ادامه بدهد؛ هیچ مانعی برای ادامه‌ی کار ایجاد نمی‌شود.
        setLocationStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }

  function handleLoadMore() {
    runSearch(items.length, true);
  }

  function handleCategoryClick(id: string) {
    setCategory((prev) => (prev === id ? null : id));
  }

  const hasMore = items.length < totalCount;

  function distanceLabel(distanceMeters: number | null): string | null {
    if (distanceMeters == null) return null;
    if (distanceMeters < 1000) {
      return indexDict.distanceM.replace("{distance}", String(Math.round(distanceMeters)));
    }
    return indexDict.distanceKm.replace("{distance}", (distanceMeters / 1000).toFixed(1));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* جستجوی دستی با نام شهر/منطقه — همیشه در دسترس، حتی اگر GPS رد شود (تسک ۷) */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Icons.Search className="w-5 h-5 text-text-muted absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" />
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={indexDict.searchPlaceholder}
            className="pr-11"
          />
        </div>

        <Button
          variant={locationStatus === "granted" ? "secondary" : "outline"}
          onClick={handleUseMyLocation}
          disabled={locationStatus === "locating"}
          loading={locationStatus === "locating"}
          loadingLabel={indexDict.locatingButton}
        >
          <Icons.LocateFixed className="w-5 h-5 ml-2" />
          {indexDict.useMyLocationButton}
        </Button>

        {locationStatus === "denied" && (
          <p className="text-xs text-text-muted">{indexDict.locationDeniedNotice}</p>
        )}

        <p className="text-xs text-text-muted">
          {locationStatus === "granted" ? indexDict.sortedByDistanceNotice : indexDict.sortedByNewestNotice}
        </p>
      </div>

      {/* چیپ‌های دسته‌بندی — چیدمان چندردیفه (wrap)، نه اسکرول افقی: همه‌ی دسته‌ها همزمان و
          بدون نیاز به هیچ تعامل اضافه (اسکرول یا باز کردن منو) دیده و لمس می‌شوند. */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
            category === null
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-main border-slate-200"
          }`}
        >
          {indexDict.allCategoriesLabel}
        </button>
        {LISTING_CATEGORIES.map((cat) => {
          const CategoryIcon = cat.icon;
          const active = category === cat.id;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                active ? "bg-primary text-white border-primary" : "bg-white text-text-main border-slate-200"
              }`}
            >
              <CategoryIcon className="w-4 h-4" />
              {categoriesDict[cat.dictKey]}
            </button>
          );
        })}
      </div>

      {/* نتایج */}
      {isPending && items.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-text-muted py-1">
          <Spinner className="w-3.5 h-3.5" />
          {indexDict.loadingButton}
        </div>
      )}
      {items.length === 0 && !isPending ? (
        <Card className="p-6 flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.Box className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-text-main">{indexDict.emptyTitle}</h2>
          <p className="text-sm text-text-muted max-w-xs">{indexDict.emptyDesc}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/${lang}/listings/${item.id}`}>
              <Card className="flex flex-col h-full active:scale-[0.98] transition-transform">
                <div className="w-full aspect-square bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getListingImageUrl(item.images[0])}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 flex flex-col gap-1">
                  <span className="text-sm font-bold text-text-main line-clamp-1">{item.title}</span>
                  <span className="text-sm font-extrabold text-primary" dir="ltr">
                    {item.price.toLocaleString()}
                  </span>
                  {distanceLabel(item.distanceMeters) && (
                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                      <Icons.MapPin className="w-3 h-3 shrink-0" />
                      {distanceLabel(item.distanceMeters)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <Button variant="outline" onClick={handleLoadMore} loading={isPending} fullWidth>
          {isPending ? indexDict.loadingButton : indexDict.loadMoreButton}
        </Button>
      )}
    </div>
  );
}