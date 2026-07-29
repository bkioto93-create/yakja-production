// مسیر فایل: src/app/[lang]/services/ActiveServiceProvidersList.tsx
// تسک ۷ فاز ۰۴ — بخش تعاملی صفحه‌ی اصلی خدمات.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** اگر متخصص حداقل یک عکس
// نمونه‌کار داشته باشد، یک نوار کوچک از حداکثر ۳ تصویر زیر اطلاعات کارت نمایش داده می‌شود — چون
// طبق ممیزی محصول، «نمونه‌کار» مهم‌ترین عامل اعتمادسازی پیش از تماس با یک متخصص است (مشابه
// Thumbtack). اگر عکسی نباشد (پروفایل‌های قدیمی)، کارت دقیقاً مثل قبل بدون این نوار نمایش داده
// می‌شود — هیچ آسیبی به پروفایل‌های موجود نمی‌رسد.
//
// **رفع خطای Build:** SERVICE_PROVIDERS_PAGE_SIZE دیگر از actions.ts (فایل "use server"، که
// دیگر این ثابت را export نمی‌کند) ایمپورت نمی‌شود، بلکه از constants.ts می‌آید — دقیقاً هم‌الگو
// با همین تغییری که قبلاً در ماژول transport انجام شد.
//
// **به‌روزرسانی UX (چیپ‌های دسته‌بندی):** چیپ‌های تخصص از حالت اسکرول افقی تک‌ردیفه
// (overflow-x-auto) به چیدمان چندردیفه‌ی «wrap» تغییر کردند. با ~۱۰ تخصص، اسکرول افقی باعث
// می‌شد بخشی از گزینه‌ها همیشه بیرون از دید کاربر بمانند و او باید حدس می‌زد که باید کنار
// بکشد. در چیدمان جدید همه‌ی گزینه‌ها همزمان و بدون نیاز به هیچ تعامل اضافه (نه اسکرول، نه باز
// کردن یک منو/دراپ‌داون) قابل مشاهده و لمس هستند — هم‌راستا با بند ۲ سند راهبردی (سادگی حداکثری
// برای کاربران کم‌تجربه) و بند «اولویت تصویر بر متن» (آیکون هر تخصص همچنان کنار برچسبش دیده
// می‌شود، برخلاف یک دراپ‌داون معمولی که معمولاً فقط متن نشان می‌دهد).
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { ReportButton } from "@/components/reports/ReportButton";
import { getBuiltinIconComponent } from "@/lib/services/serviceCategoryIcons";
import { getServiceProviderImageUrl } from "@/lib/services/images";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { searchActiveServiceProvidersAction } from "./actions";
import { SERVICE_PROVIDERS_PAGE_SIZE } from "./constants";
import type { ServiceCategory } from "@/lib/services/serviceCategories";
import type { ActiveServiceProviderSummary } from "@/lib/services/serviceProviderQueries";
import type { ProvinceDict } from "@/components/province/ProvincePickerModal";

type ServicesListDict = {
  searchPlaceholder: string;
  useMyLocationButton: string;
  locatingButton: string;
  locationDeniedNotice: string;
  sortedByDistanceNotice: string;
  sortedByNewestNotice: string;
  allCategoriesLabel: string;
  distanceKm: string;
  distanceM: string;
  emptyTitle: string;
  emptyDesc: string;
  loadMoreButton: string;
  loadingButton: string;
  callButton: string;
};

type LocationStatus = "idle" | "locating" | "granted" | "denied";

const SEARCH_DEBOUNCE_MS = 400;
const MAX_PREVIEW_PHOTOS = 3;

export function ActiveServiceProvidersList({
  lang,
  dict,
  reportButtonLabel,
  categories,
  provinceDict,
  selectedProvince,
  initialItems,
  initialTotalCount,
}: {
  lang: string;
  dict: ServicesListDict;
  reportButtonLabel: string;
  categories: ServiceCategory[];
  provinceDict: ProvinceDict;
  selectedProvince: string | null;
  initialItems: ActiveServiceProviderSummary[];
  initialTotalCount: number;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [queryText, setQueryText] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [items, setItems] = useState<ActiveServiceProviderSummary[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const isFirstRun = useRef(true);
  const itemsLengthRef = useRef(initialItems.length);
  itemsLengthRef.current = items.length;

  function runSearch(offset: number, append: boolean, limitOverride?: number) {
    const requestId = ++requestIdRef.current;
    startTransition(async () => {
      const result = await searchActiveServiceProvidersAction({
        category,
        province: selectedProvince,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        query: queryText,
        offset,
        limit: limitOverride,
      });
      if (requestId !== requestIdRef.current) return;
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setTotalCount(result.totalCount);
    });
  }

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
  }, [category, queryText, coords, selectedProvince]);

  useEffect(() => {
    const channel = supabaseBrowserClient
      .channel("active-service-providers-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_providers" }, () => {
        runSearch(0, false, Math.max(itemsLengthRef.current, SERVICE_PROVIDERS_PAGE_SIZE));
      })
      .subscribe();

    return () => {
      supabaseBrowserClient.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      return dict.distanceM.replace("{distance}", String(Math.round(distanceMeters)));
    }
    return dict.distanceKm.replace("{distance}", (distanceMeters / 1000).toFixed(1));
  }

  function categoryLabel(item: ActiveServiceProviderSummary): string {
    return lang === "ps" ? item.categoryNamePs : item.categoryNameFa;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Icons.Search className="w-5 h-5 text-text-muted absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" />
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="pr-11"
          />
        </div>

        <Button
          variant={locationStatus === "granted" ? "secondary" : "outline"}
          onClick={handleUseMyLocation}
          disabled={locationStatus === "locating"}
          loading={locationStatus === "locating"}
          loadingLabel={dict.locatingButton}
        >
          <Icons.LocateFixed className="w-5 h-5 ml-2" />
          {dict.useMyLocationButton}
        </Button>

        {locationStatus === "denied" && (
          <p className="text-xs text-text-muted">{dict.locationDeniedNotice}</p>
        )}

        <p className="text-xs text-text-muted">
          {locationStatus === "granted" ? dict.sortedByDistanceNotice : dict.sortedByNewestNotice}
        </p>
      </div>

      {/* چیپ‌های دسته‌بندی — چیدمان چندردیفه (wrap)، نه اسکرول افقی: همه‌ی تخصص‌ها همزمان و
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
          {dict.allCategoriesLabel}
        </button>
        {categories.map((cat) => {
          const CategoryIcon = getBuiltinIconComponent(cat.iconKey);
          const active = category === cat.id;
          const label = lang === "ps" ? cat.namePs : cat.nameFa;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                active ? "bg-primary text-white border-primary" : "bg-white text-text-main border-slate-200"
              }`}
            >
              {cat.iconSource === "custom" && cat.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.iconUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <CategoryIcon className="w-4 h-4" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {selectedProvince && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-text-muted -mb-1">
          <Icons.MapPin className="w-3.5 h-3.5" />
          {provinceDict.resultsForLabel}: {provinceDict.names[selectedProvince]}
        </p>
      )}
      {isPending && items.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-text-muted py-1">
          <Spinner className="w-3.5 h-3.5" />
          {dict.loadingButton}
        </div>
      )}
      {items.length === 0 && !isPending ? (
        <Card className="p-6 flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.Wrench className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-text-main">{dict.emptyTitle}</h2>
          <p className="text-sm text-text-muted max-w-xs">{dict.emptyDesc}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((provider) => {
            const ProviderIcon =
              provider.categoryIconSource === "builtin"
                ? getBuiltinIconComponent(provider.categoryIconKey)
                : null;
            const previewPhotos = provider.images.slice(0, MAX_PREVIEW_PHOTOS);
            return (
              <Card key={provider.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                    {previewPhotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getServiceProviderImageUrl(previewPhotos[0])}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : provider.categoryIconSource === "custom" && provider.categoryIconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={provider.categoryIconUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-6 h-6 object-contain"
                      />
                    ) : ProviderIcon ? (
                      <ProviderIcon className="w-6 h-6" />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-bold text-text-main">{categoryLabel(provider)}</span>
                    <span className="text-xs text-text-muted line-clamp-1">{provider.address}</span>
                    {provider.description && (
                      <span className="text-xs text-text-muted line-clamp-1">
                        {provider.description}
                      </span>
                    )}
                    {distanceLabel(provider.distanceMeters) && (
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Icons.MapPin className="w-3 h-3 shrink-0" />
                        {distanceLabel(provider.distanceMeters)}
                      </span>
                    )}
                  </div>
                </div>

                {/* نوار نمونه‌کار — فقط اگر متخصص عکس داشته باشد نمایش داده می‌شود. */}
                {previewPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previewPhotos.map((path) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={path}
                        src={getServiceProviderImageUrl(path)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    ))}
                  </div>
                )}

                <a href={`tel:${provider.contactPhone}`} className="w-full">
                  <Button variant="primary" fullWidth>
                    <Icons.Phone className="w-5 h-5 ml-2" />
                    {dict.callButton}
                  </Button>
                </a>

                <ReportButton
                  lang={lang}
                  targetType="service_provider"
                  targetId={provider.id}
                  label={reportButtonLabel}
                  className="self-center"
                />
              </Card>
            );
          })}
        </div>
      )}

      {hasMore && (
        <Button variant="outline" onClick={handleLoadMore} loading={isPending} fullWidth>
          {isPending ? dict.loadingButton : dict.loadMoreButton}
        </Button>
      )}
    </div>
  );
}