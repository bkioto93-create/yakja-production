// مسیر فایل: src/app/[lang]/real-estate/RealEstateSearch.tsx
// تسک ۶ فاز ۰۵ — بخش تعاملی صفحه‌ی فهرست آگهی‌های ملک: فیلتر نوع ملک (چیپ‌های آیکون‌دار، دقیقاً
// هم‌الگو با ListingsSearch.tsx فاز ۰۲ تسک ۷)، فیلتر نوع معامله (فروش/اجاره/همه — چون real_estate
// برخلاف listings یک ستون فیلتر دوم هم دارد: deal_type)، دکمه‌ی «نمایش نزدیک‌ترین‌ها» (GPS،
// اختیاری)، و جستجوی دستی متنی با نام شهر/منطقه که همیشه در دسترس است — چه GPS داده شود چه رد
// شود. هر تغییری در نوع ملک/نوع معامله/متن جستجو/مختصات با یک تاخیر کوتاه (ضددستپاچگی تایپ) و از
// طریق Server Action «searchRealEstateAction» یک جستجوی تازه می‌سازد؛ صفحه‌بندی با دکمه‌ی «نمایش
// موارد بیشتر» (نه اسکرول بی‌نهایت خودکار) انجام می‌شود تا روی اینترنت ۲G/۳G مصرف داده کاملاً زیر
// کنترل کاربر بماند.
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icons } from "@/components/ui/Icons";
import { PROPERTY_TYPES } from "@/lib/realEstate/propertyTypes";
import { DEAL_TYPES, type DealTypeId } from "@/lib/realEstate/dealTypes";
import { getRealEstateImageUrl } from "@/lib/realEstate/images";
import { searchRealEstateAction } from "./actions";
import type { RealEstateSummary } from "@/lib/realEstate/queries";
import type { Locale } from "@/lib/i18n/constants";

type RealEstateDict = {
  propertyTypes: Record<string, string>;
  dealTypes: Record<string, string>;
  index: Record<string, string>;
};

type LocationStatus = "idle" | "locating" | "granted" | "denied";

const SEARCH_DEBOUNCE_MS = 400;

export function RealEstateSearch({
  lang,
  dict,
  initialItems,
  initialTotalCount,
}: {
  lang: Locale;
  dict: RealEstateDict;
  initialItems: RealEstateSummary[];
  initialTotalCount: number;
}) {
  const indexDict = dict.index;
  const propertyTypesDict = dict.propertyTypes;
  const dealTypesDict = dict.dealTypes;

  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [dealType, setDealType] = useState<DealTypeId | null>(null);
  const [queryText, setQueryText] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [items, setItems] = useState<RealEstateSummary[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const isFirstRun = useRef(true);

  function runSearch(offset: number, append: boolean) {
    const requestId = ++requestIdRef.current;
    startTransition(async () => {
      const result = await searchRealEstateAction({
        propertyType,
        dealType,
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

  // جستجوی مجدد هر بار که نوع ملک، نوع معامله، متن جستجو، یا مختصات مکانی تغییر کند — با تاخیر
  // کوتاه برای متن جستجو تا هر ضربه‌ی کیبورد یک درخواست جداگانه نسازد. اولین اجرا (mount) عمداً
  // رد می‌شود چون نتیجه‌ی همان حالت پیش‌فرض از قبل توسط سرور (page.tsx) آورده شده.
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
  }, [propertyType, dealType, queryText, coords]);

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
        // رد دسترسی یا خطای دیگر GPS — کاربر همچنان می‌تواند با جستجوی دستی متنی ادامه بدهد؛
        // هیچ مانعی برای ادامه‌ی کار ایجاد نمی‌شود.
        setLocationStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }

  function handleLoadMore() {
    runSearch(items.length, true);
  }

  function handlePropertyTypeClick(id: string) {
    setPropertyType((prev) => (prev === id ? null : id));
  }

  function handleDealTypeClick(id: DealTypeId) {
    setDealType((prev) => (prev === id ? null : id));
  }

  const hasMore = items.length < totalCount;

  function distanceLabel(distanceMeters: number | null): string | null {
    if (distanceMeters == null) return null;
    if (distanceMeters < 1000) {
      return indexDict.distanceM.replace("{distance}", String(Math.round(distanceMeters)));
    }
    return indexDict.distanceKm.replace("{distance}", (distanceMeters / 1000).toFixed(1));
  }

  function propertyTypeLabel(id: string): string {
    const pt = PROPERTY_TYPES.find((p) => p.id === id);
    return pt ? propertyTypesDict[pt.dictKey] : id;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* جستجوی دستی با نام شهر/منطقه — همیشه در دسترس، حتی اگر GPS رد شود */}
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
        >
          <Icons.LocateFixed className="w-5 h-5 ml-2" />
          {locationStatus === "locating" ? indexDict.locatingButton : indexDict.useMyLocationButton}
        </Button>

        {locationStatus === "denied" && (
          <p className="text-xs text-text-muted">{indexDict.locationDeniedNotice}</p>
        )}

        <p className="text-xs text-text-muted">
          {locationStatus === "granted" ? indexDict.sortedByDistanceNotice : indexDict.sortedByNewestNotice}
        </p>
      </div>

      {/* چیپ‌های نوع معامله — فروش/اجاره/همه (فیلتر دومِ اختصاصی ماژول املاک) */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDealType(null)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
            dealType === null
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-main border-slate-200"
          }`}
        >
          {indexDict.allDealTypesLabel}
        </button>
        {DEAL_TYPES.map((dt) => {
          const active = dealType === dt.id;
          return (
            <button
              type="button"
              key={dt.id}
              onClick={() => handleDealTypeClick(dt.id)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                active ? "bg-primary text-white border-primary" : "bg-white text-text-main border-slate-200"
              }`}
            >
              {dealTypesDict[dt.dictKey]}
            </button>
          );
        })}
      </div>

      {/* چیپ‌های نوع ملک — همیشه یک نوع یا «همه» انتخاب‌شده است (بدون انتخاب چندگانه) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setPropertyType(null)}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
            propertyType === null
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-main border-slate-200"
          }`}
        >
          {indexDict.allPropertyTypesLabel}
        </button>
        {PROPERTY_TYPES.map((pt) => {
          const PropertyIcon = pt.icon;
          const active = propertyType === pt.id;
          return (
            <button
              type="button"
              key={pt.id}
              onClick={() => handlePropertyTypeClick(pt.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                active ? "bg-primary text-white border-primary" : "bg-white text-text-main border-slate-200"
              }`}
            >
              <PropertyIcon className="w-4 h-4" />
              {propertyTypesDict[pt.dictKey]}
            </button>
          );
        })}
      </div>

      {/* نتایج */}
      {items.length === 0 && !isPending ? (
        <Card className="p-6 flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.Home className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-text-main">{indexDict.emptyTitle}</h2>
          <p className="text-sm text-text-muted max-w-xs">{indexDict.emptyDesc}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/${lang}/real-estate/${item.id}`}>
              <Card className="flex flex-col h-full active:scale-[0.98] transition-transform">
                <div className="w-full aspect-square bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getRealEstateImageUrl(item.images[0])}
                    alt={propertyTypeLabel(item.propertyType)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 flex flex-col gap-1">
                  <span className="text-sm font-bold text-text-main line-clamp-1">
                    {propertyTypeLabel(item.propertyType)} · {dealTypesDict[item.dealType]}
                  </span>
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