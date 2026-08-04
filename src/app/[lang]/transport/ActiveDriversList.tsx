// مسیر فایل: src/app/[lang]/transport/ActiveDriversList.tsx
// تسک ۸ فاز ۰۳ — بخش تعاملی صفحه‌ی اصلی حمل‌ونقل: دکمه‌ی «نمایش نزدیک‌ترین‌ها» (GPS، اختیاری،
// هم‌الگو با ListingsSearch.tsx فاز ۰۲)، فهرست رانندگان فعال، و اشتراک زنده‌ی Supabase Realtime
// روی جدول drivers.
//
// نکته‌ی مهم درباره‌ی پیاده‌سازی Realtime: با رسیدن هر رویدادی (INSERT/UPDATE/DELETE روی drivers —
// یعنی راننده‌ای فعال/غیرفعال شد یا موقعیتش تغییر کرد)، به‌جای پچ‌کردن دستی آرایه از روی payload
// خودِ رویداد، همان Server Action دوباره صدا زده می‌شود. این انتخاب عمدی است: payload رویداد تابع
// سیاست RLS جدول drivers است (فقط رانندگان فعال قابل مشاهده‌اند) و مرتب‌سازی/فاصله باید دوباره
// توسط PostGIS محاسبه شود؛ ساده‌ترین و صحیح‌ترین راه، خواندن دوباره‌ی کل فهرست از سرور (با
// supabaseAdminClient که RLS را دور می‌زند) است — رویداد Realtime اینجا صرفاً «علامت شروع
// دوباره‌خوانی» است، نه منبع داده.
//
// **به‌روزرسانی تسک ۹ فاز ۰۳:** دکمه‌ی تماس یک‌لمسی با پروتکل tel: روی هر کارت راننده اضافه شد —
// دقیقاً همان الگوی دکمه‌ی تماس در صفحه‌ی جزئیات آگهی (src/app/[lang]/listings/[id]/page.tsx، فاز
// ۰۲) و صفحه‌ی «تماس با ما». هیچ تغییر SQL/کوئری لازم نبود چون contact_phone از همان تسک ۸ در
// ActiveDriverSummary موجود بود؛ این تسک صرفاً یک عنصر رابط کاربری اضافه کرد.
//
// **به‌روزرسانی (بازطراحی عکس‌ها — درخواست صریح کارفرما):** آواتار کارت حالا همیشه از
// driver.personalPhotoPath می‌آید (نه دیگر اولین عضو یک آرایه‌ی بی‌معنا) — چون این ستون همیشه
// دقیقاً «عکس خودِ راننده» است، نه هر عکس دلبخواهی. علاوه بر آن، اگر راننده عکس وسیله هم گذاشته
// باشد (driver.vehiclePhotoPath، اختیاری)، یک نوار عکسِ پهن‌تر زیر ردیف بالای کارت نمایش داده
// می‌شود — دقیقاً همان‌جایی که قبلاً پخش‌کننده‌ی ویدئوی VIP بود؛ اگر هم عکس وسیله هم ویدئوی VIP
// موجود باشد، هردو پشت‌سرهم (عکس بالاتر، چون همیشگی‌تر است؛ ویدئو زیرش، چون ویژگی VIP است).
//
// **رفع خطای Build:** DRIVERS_PAGE_SIZE دیگر از actions.ts (فایل "use server") ایمپورت
// نمی‌شود، بلکه از constants.ts می‌آید.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** ۱) VipBadge کنار نام نوع وسیله، فقط اگر driver.ownerIsVip؛
// ۲) اگر راننده ویدئوی VIP دارد (driver.videoPath)، یک پخش‌کننده‌ی کوچک <video> زیر ردیف بالای
// کارت نمایش داده می‌شود — طبق بند ۵ پرامپت VIP («کارت راننده»).
// **به‌روزرسانی — فیلتر نوع وسیله:** طبق درخواست صریح کارفرما، یک ردیف فیلتر افقی (آیکون هر نوع
// وسیله + «همه») بالای فهرست اضافه شد. با زدن هرکدام، فهرست فقط همان نوع وسیله را نشان می‌دهد،
// همچنان با همان مرتب‌سازیِ «نزدیک‌ترین اول» (اگر GPS داده شده باشد). فیلتر state محلی است (نه
// query string)، دقیقاً هم‌الگو با فیلتر GPS موجود.
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { ReportButton } from "@/components/reports/ReportButton";
import { VipBadge } from "@/components/vip/VipBadge";
import { ChatButton, type ChatButtonDict } from "@/components/chat/ChatButton";
import { VEHICLE_TYPES, type VehicleTypeId } from "@/lib/transport/vehicleTypes";
import { getDriverImageUrl, getDriverVideoUrl } from "@/lib/transport/images";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { searchActiveDriversAction } from "./actions";
import { DRIVERS_PAGE_SIZE } from "./constants";
import type { ActiveDriverSummary } from "@/lib/transport/driverQueries";
import type { ProvinceDict } from "@/components/province/ProvincePickerModal";
import type { Locale } from "@/lib/i18n/constants";

type TransportListDict = {
  useMyLocationButton: string;
  locatingButton: string;
  locationDeniedNotice: string;
  sortedByDistanceNotice: string;
  sortedByNewestNotice: string;
  distanceKm: string;
  distanceM: string;
  emptyTitle: string;
  emptyDesc: string;
  loadMoreButton: string;
  loadingButton: string;
  callButton: string;
  allVehicleTypesLabel: string;
};

// تسک ۳ فاز ۰۶ — برچسب دکمه‌ی «گزارش تخلف»؛ از dict.reports.reportButtonLabel خوانده و از
// page.tsx به این کامپوننت پاس داده می‌شود (نه بخشی از TransportListDict چون یک متن مشترکِ بین
// همه‌ی ماژول‌هاست، نه اختصاصی ماژول حمل‌ونقل).

type LocationStatus = "idle" | "locating" | "granted" | "denied";

function vehicleIcon(vehicleType: string) {
  const found = VEHICLE_TYPES.find((v) => v.id === vehicleType);
  return found ? found.icon : VEHICLE_TYPES[VEHICLE_TYPES.length - 1].icon;
}

export function ActiveDriversList({
  lang,
  dict,
  reportButtonLabel,
  vehicleTypesDict,
  vipBadgeLabel,
  chatButtonDict,
  viewerId,
  provinceDict,
  selectedProvince,
  initialItems,
  initialTotalCount,
}: {
  lang: string;
  dict: TransportListDict;
  reportButtonLabel: string;
  vehicleTypesDict: Record<string, string>;
  vipBadgeLabel: string;
  chatButtonDict: ChatButtonDict;
  viewerId: string | null;
  provinceDict: ProvinceDict;
  selectedProvince: string | null;
  initialItems: ActiveDriverSummary[];
  initialTotalCount: number;
}) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleTypeId | null>(null);
  const [items, setItems] = useState<ActiveDriverSummary[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const requestIdRef = useRef(0);
  const itemsLengthRef = useRef(initialItems.length);
  itemsLengthRef.current = items.length;

  function runSearch(offset: number, append: boolean, limitOverride?: number) {
    const requestId = ++requestIdRef.current;
    startTransition(async () => {
      const result = await searchActiveDriversAction({
        province: selectedProvince,
        vehicleType: selectedVehicleType,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        offset,
        limit: limitOverride,
      });
      if (requestId !== requestIdRef.current) return;
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setTotalCount(result.totalCount);
    });
  }

  function handleSelectVehicleType(vehicleType: VehicleTypeId | null) {
    if (vehicleType === selectedVehicleType) return;
    setSelectedVehicleType(vehicleType);
  }

  // جستجوی مجدد هر بار که مختصات کاربر، ولایت، یا فیلتر نوع وسیله تغییر کند.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    runSearch(0, false, Math.max(itemsLengthRef.current, DRIVERS_PAGE_SIZE));
    // فاز ۱۰: وقتی کاربر از نوار سراسری ولایتش را عوض می‌کند، router.refresh() این prop را
    // مقدار تازه می‌دهد و همین effect دوباره اجرا می‌شود.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, selectedProvince, selectedVehicleType]);

  // اشتراک زنده‌ی Realtime — تسک ۸.
  useEffect(() => {
    const channel = supabaseBrowserClient
      .channel("active-drivers-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
        runSearch(0, false, Math.max(itemsLengthRef.current, DRIVERS_PAGE_SIZE));
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

  const hasMore = items.length < totalCount;

  function distanceLabel(distanceMeters: number | null): string | null {
    if (distanceMeters == null) return null;
    if (distanceMeters < 1000) {
      return dict.distanceM.replace("{distance}", String(Math.round(distanceMeters)));
    }
    return dict.distanceKm.replace("{distance}", (distanceMeters / 1000).toFixed(1));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
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

      {/* فیلتر نوع وسیله — ردیف افقی اسکرول‌شونده، دقیقاً مثل اپ‌های تاکسی‌یابی. زدن هرکدام
          فهرست را فقط به همان نوع محدود می‌کند (state محلی، بدون query string، هم‌الگو با فیلتر
          GPS بالا). */}
      <div className="flex gap-2.5 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => handleSelectVehicleType(null)}
          className={`shrink-0 flex flex-col items-center gap-1.5 w-16 py-2 rounded-2xl transition-colors ${
            selectedVehicleType === null ? "bg-primary/10" : ""
          }`}
        >
          <span
            className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
              selectedVehicleType === null
                ? "border-primary text-primary bg-white"
                : "border-slate-200 text-text-muted bg-white"
            }`}
          >
            <Icons.Truck className="w-5 h-5" />
          </span>
          <span
            className={`text-[11px] font-bold text-center leading-tight ${
              selectedVehicleType === null ? "text-primary" : "text-text-muted"
            }`}
          >
            {dict.allVehicleTypesLabel}
          </span>
        </button>

        {VEHICLE_TYPES.map((vehicle) => {
          const VehicleTypeIcon = vehicle.icon;
          const isActive = selectedVehicleType === vehicle.id;
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => handleSelectVehicleType(vehicle.id)}
              className={`shrink-0 flex flex-col items-center gap-1.5 w-16 py-2 rounded-2xl transition-colors ${
                isActive ? "bg-primary/10" : ""
              }`}
            >
              <span
                className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                  isActive
                    ? "border-primary text-primary bg-white"
                    : "border-slate-200 text-text-muted bg-white"
                }`}
              >
                <VehicleTypeIcon className="w-5 h-5" />
              </span>
              <span
                className={`text-[11px] font-bold text-center leading-tight truncate w-full ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                {vehicleTypesDict[vehicle.id]}
              </span>
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
            <Icons.Truck className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-text-main">{dict.emptyTitle}</h2>
          <p className="text-sm text-text-muted max-w-xs">{dict.emptyDesc}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((driver) => {
            const VehicleIcon = vehicleIcon(driver.vehicleType);
            const avatarPhoto = driver.personalPhotoPath;
            return (
              <Card key={driver.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getDriverImageUrl(avatarPhoto)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <VehicleIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-main">{vehicleTypesDict[driver.vehicleType]}</span>
                      {driver.ownerIsVip && <VipBadge label={vipBadgeLabel} />}
                    </div>
                    {driver.vehicleDetails && (
                      <span className="text-xs text-text-muted line-clamp-1">{driver.vehicleDetails}</span>
                    )}
                    {distanceLabel(driver.distanceMeters) && (
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Icons.MapPin className="w-3 h-3 shrink-0" />
                        {distanceLabel(driver.distanceMeters)}
                      </span>
                    )}
                  </div>
                </div>

                {/* عکس وسیله‌ی نقلیه (اختیاری) — یک نوار پهن، جدا از آواتار دایره‌ای شخصی، تا
                    کاربر پیش از تماس، هم چهره‌ی راننده هم خودِ وسیله را ببیند. */}
                {driver.vehiclePhotoPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getDriverImageUrl(driver.vehiclePhotoPath)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-video object-cover rounded-xl border border-slate-100"
                  />
                )}

                {/* فاز ۱۱ — ویدئوی اختیاری VIP */}
                {driver.videoPath && (
                  <video
                    src={getDriverVideoUrl(driver.videoPath)}
                    controls
                    className="w-full aspect-video rounded-xl bg-black"
                  />
                )}

                {/* تسک ۹ — دکمه‌ی تماس یک‌لمسی؛ کاربر هرگز نیازی به کپی/تایپ شماره ندارد. */}
                <a href={`tel:${driver.contactPhone}`} className="w-full">
                  <Button variant="primary" fullWidth>
                    <Icons.Phone className="w-5 h-5 ml-2" />
                    {dict.callButton}
                  </Button>
                </a>

                {/* فاز ۱۲ — دکمه‌ی «چت با راننده» */}
                <ChatButton
                  lang={lang as Locale}
                  viewerId={viewerId}
                  contextType="driver"
                  contextId={driver.id}
                  ownerId={driver.ownerId}
                  dict={chatButtonDict}
                  fullWidth
                />

                {/* تسک ۳ فاز ۰۶ — دکمه‌ی «گزارش تخلف» روی هر راننده؛ target_type = driver */}
                <ReportButton
                  lang={lang}
                  targetType="driver"
                  targetId={driver.id}
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