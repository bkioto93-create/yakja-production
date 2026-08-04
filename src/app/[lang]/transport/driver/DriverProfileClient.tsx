// مسیر فایل: src/app/[lang]/transport/driver/DriverProfileClient.tsx
// تسک ۴ فاز ۰۳ — بخش تعاملی فرم ثبت/ویرایش پروفایل راننده.
//
// **به‌روزرسانی (بازطراحی عکس‌ها — درخواست صریح کارفرما):** بخش «عکس‌ها» که قبلاً یک گرید عمومی
// تا ۵ عکسِ بی‌معنا بود («همه‌ی عکس‌ها رو یه جا میزاریم»)، با دو کارت آپلود مجزا و برچسب‌دار
// جایگزین شد — دقیقاً همان چیزی که کارفرما خواسته بود: «روی کارتش نوشته شده باشه این عکس برای
// آپلود عکس ماشین یا عکس خودتان»:
//   ۱) «عکس خودتان» — الزامی (بدون آن ثبت فرم رد می‌شود).
//   ۲) «عکس وسیله‌ی نقلیه» — اختیاری.
// فشرده‌سازی همچنان با همان compressImageFile قبلی انجام می‌شود (بدون تغییر در موتور
// فشرده‌سازی خودش)، فقط حالا هرکدام مستقل و جداگانه است، نه یک آرایه‌ی مشترک.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** یک بخش «ویدئو» بعد از بخش «عکس‌ها» اضافه شد — همان الگوی
// دو-حالته‌ی مرحله‌ی ۲ NewListingWizard.tsx: کاربر VIP یک ابزار آپلود/پیش‌نمایش/حذف تک‌ویدئویی
// می‌بیند؛ کاربر غیر-VIP به‌جای آن، VipUpsellNotice مشترک را می‌بیند.
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconCategoryPicker } from "@/components/ui/IconCategoryPicker";
import { Switch } from "@/components/ui/Switch";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { VipUpsellNotice } from "@/components/vip/VipUpsellNotice";
import { VEHICLE_TYPES, type VehicleTypeId } from "@/lib/transport/vehicleTypes";
import { compressImageFile, type CompressedImage } from "@/lib/transport/imageCompression";
import { getDriverImageUrl } from "@/lib/transport/images";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import {
  saveDriverProfileAction,
  setDriverActiveStatusAction,
  updateDriverLocationAction,
  createDriverPhotoUploadSlotAction,
  createDriverSignedVideoUploadSlotAction,
  type DriverPhotoType,
} from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";
import type { MyDriverProfile } from "@/lib/transport/driverQueries";
import { ProvinceSelectField } from "@/components/province/ProvinceSelectField";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

type LocationTrackingStatus = "idle" | "active" | "denied" | "unsupported";

// یک کارت واحد آپلود عکس — یک‌بار نوشته شده و دوبار استفاده می‌شود (عکس خودتان + عکس وسیله)،
// چون هردو از نظر ظاهری کاملاً یکسان‌اند و فقط برچسب/الزامی‌بودن فرق دارد. طبق درخواست صریح
// کارفرما، برچسب («این عکس برای...») همیشه بالای خودِ کارت نوشته شده است — کاربر هرگز نباید حدس
// بزند کدام اسلات برای چیست.
function DriverPhotoSlot({
  title,
  badgeLabel,
  badgeColorClass,
  previewUrl,
  isCompressing,
  onPick,
  onRemove,
  addButtonLabel,
  removeLabel,
  loadingLabel,
}: {
  title: string;
  badgeLabel: string;
  badgeColorClass: string;
  previewUrl: string | null;
  isCompressing: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
  addButtonLabel: string;
  removeLabel: string;
  loadingLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-text-main">{title}</span>
        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${badgeColorClass}`}>
          {badgeLabel}
        </span>
      </div>

      {previewUrl ? (
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold"
          >
            ×
          </button>
        </div>
      ) : (
        <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-text-muted cursor-pointer active:scale-95 transition-transform">
          {isCompressing ? (
            <Spinner className="w-6 h-6" label={loadingLabel} />
          ) : (
            <>
              <Icons.Camera className="w-6 h-6" />
              <span className="text-xs font-bold text-center px-2">{addButtonLabel}</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={isCompressing}
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

export function DriverProfileClient({
  lang,
  dict,
  defaultContactPhone,
  existingProfile,
  isVip,
}: {
  lang: Locale;
  dict: Dict;
  defaultContactPhone: string;
  existingProfile: MyDriverProfile | null;
  isVip: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formDict = dict.transport.driverProfile;
  const errorsDict = formDict.errors as Record<string, string>;
  const vehicleTypesDict = dict.transport.vehicleTypes as Record<string, string>;

  const isEditMode = !!existingProfile;

  const [vehicleType, setVehicleType] = useState<VehicleTypeId | "">(
    existingProfile?.vehicleType ?? ""
  );
  const [vehicleDetails, setVehicleDetails] = useState(existingProfile?.vehicleDetails ?? "");
  const [province, setProvince] = useState<string | null>(existingProfile?.province ?? null);
  const [contactPhone, setContactPhone] = useState(
    existingProfile?.contactPhone ?? defaultContactPhone
  );
  const [isSubmitting, startSubmitting] = useTransition();

  // عکس خودِ راننده — الزامی. existing = مسیر ذخیره‌شده‌ی قبلی (حالت ویرایش)؛ new = عکس تازه‌ی
  // فشرده‌شده در همین جلسه (فقط هنگام ذخیره‌ی فرم واقعاً آپلود می‌شود).
  const [existingPersonalPhotoPath, setExistingPersonalPhotoPath] = useState<string | null>(
    existingProfile?.personalPhotoPath ?? null
  );
  const [newPersonalPhoto, setNewPersonalPhoto] = useState<CompressedImage | null>(null);
  const [isCompressingPersonal, setIsCompressingPersonal] = useState(false);

  // عکس وسیله‌ی نقلیه — اختیاری، همان الگوی بالا.
  const [existingVehiclePhotoPath, setExistingVehiclePhotoPath] = useState<string | null>(
    existingProfile?.vehiclePhotoPath ?? null
  );
  const [newVehiclePhoto, setNewVehiclePhoto] = useState<CompressedImage | null>(null);
  const [isCompressingVehicle, setIsCompressingVehicle] = useState(false);

  // فاز ۱۱ — ویدئوی موجود (حالت ویرایش) + ویدئوی تازه‌ی انتخاب‌شده در همین جلسه.
  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(
    existingProfile?.videoPath ?? null
  );
  const [newVideo, setNewVideo] = useState<{ file: File; previewUrl: string } | null>(null);

  const [isActive, setIsActive] = useState(existingProfile?.isActive ?? false);
  const [isTogglingActive, startTogglingActive] = useTransition();

  const [locationTrackingStatus, setLocationTrackingStatus] =
    useState<LocationTrackingStatus>("idle");

  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  async function handlePickPhoto(photoType: DriverPhotoType, file: File | undefined) {
    if (!file) return;
    const setIsCompressingFor =
      photoType === "personal" ? setIsCompressingPersonal : setIsCompressingVehicle;
    const setNewPhotoFor = photoType === "personal" ? setNewPersonalPhoto : setNewVehiclePhoto;
    const currentNewPhoto = photoType === "personal" ? newPersonalPhoto : newVehiclePhoto;

    setIsCompressingFor(true);
    try {
      const compressed = await compressImageFile(file);
      // اگر قبلاً یک عکسِ تازه‌ی دیگر برای همین اسلات انتخاب شده بود (و هنوز آپلود نشده)، پیش از
      // جایگزینی، URL پیش‌نمایش قدیمی آزاد می‌شود — جلوگیری از نشتِ حافظه‌ی مرورگر.
      if (currentNewPhoto) URL.revokeObjectURL(currentNewPhoto.previewUrl);
      setNewPhotoFor(compressed);
    } catch {
      showToast(errorText("compressionFailed"), "error");
    } finally {
      setIsCompressingFor(false);
    }
  }

  function handleRemovePhoto(photoType: DriverPhotoType) {
    if (photoType === "personal") {
      if (newPersonalPhoto) URL.revokeObjectURL(newPersonalPhoto.previewUrl);
      setNewPersonalPhoto(null);
      setExistingPersonalPhotoPath(null);
    } else {
      if (newVehiclePhoto) URL.revokeObjectURL(newVehiclePhoto.previewUrl);
      setNewVehiclePhoto(null);
      setExistingVehiclePhotoPath(null);
    }
  }

  function handleAddVideo(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast(errorText("invalidVideoType"), "error");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      showToast(errorText("videoTooLarge"), "error");
      return;
    }
    if (newVideo) URL.revokeObjectURL(newVideo.previewUrl);
    setNewVideo({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handleRemoveVideo() {
    if (newVideo) URL.revokeObjectURL(newVideo.previewUrl);
    setNewVideo(null);
    setExistingVideoPath(null);
  }

  function handleSubmit() {
    if (!vehicleType) {
      showToast(errorText("invalidVehicleType"), "error");
      return;
    }
    if (!province) {
      showToast(dict.province.fieldError, "error");
      return;
    }
    if (!contactPhone.trim()) {
      showToast(errorText("invalidPhone"), "error");
      return;
    }
    // عکس خودِ راننده الزامی است — یا از قبل ثبت شده (existing) یا همین الان انتخاب شده (new)؛
    // اگر هیچ‌کدام نبود، فرم اصلاً به سرور ارسال نمی‌شود.
    if (!existingPersonalPhotoPath && !newPersonalPhoto) {
      showToast(errorText("personalPhotoRequired"), "error");
      return;
    }

    startSubmitting(async () => {
      // آپلود عکس تازه‌ی «خودِ راننده» (اگر انتخاب شده) — دقیقاً هم‌جریان NewListingWizard
      // (فاز ۰۲)، فقط حالا برای یک اسلات مشخص به‌جای یک آرایه.
      let finalPersonalPhotoPath: string | null = existingPersonalPhotoPath;
      if (newPersonalPhoto) {
        const slotResult = await createDriverPhotoUploadSlotAction("personal");
        if (!slotResult.success) {
          showToast(errorText(slotResult.error), "error");
          return;
        }
        const { error: uploadError } = await supabaseBrowserClient.storage
          .from("drivers-images")
          .uploadToSignedUrl(slotResult.slot.path, slotResult.slot.token, newPersonalPhoto.blob, {
            contentType: "image/jpeg",
          });
        if (uploadError) {
          showToast(errorText("uploadFailed"), "error");
          return;
        }
        finalPersonalPhotoPath = slotResult.slot.path;
      }

      // همان الگو برای عکس وسیله‌ی نقلیه — اختیاری، پس فقط اگر واقعاً انتخاب شده آپلود می‌شود.
      let finalVehiclePhotoPath: string | null = existingVehiclePhotoPath;
      if (newVehiclePhoto) {
        const slotResult = await createDriverPhotoUploadSlotAction("vehicle");
        if (!slotResult.success) {
          showToast(errorText(slotResult.error), "error");
          return;
        }
        const { error: uploadError } = await supabaseBrowserClient.storage
          .from("drivers-images")
          .uploadToSignedUrl(slotResult.slot.path, slotResult.slot.token, newVehiclePhoto.blob, {
            contentType: "image/jpeg",
          });
        if (uploadError) {
          showToast(errorText("uploadFailed"), "error");
          return;
        }
        finalVehiclePhotoPath = slotResult.slot.path;
      }

      // فاز ۱۱ — آپلود ویدئوی تازه (اگر وجود داشته باشد و کاربر VIP باشد).
      let finalVideoPath: string | null = existingVideoPath;
      if (isVip && newVideo) {
        const videoSlotResult = await createDriverSignedVideoUploadSlotAction();
        if (!videoSlotResult.success) {
          showToast(errorText(videoSlotResult.error), "error");
          return;
        }
        const { error: videoUploadError } = await supabaseBrowserClient.storage
          .from("drivers-videos")
          .uploadToSignedUrl(videoSlotResult.slot.path, videoSlotResult.slot.token, newVideo.file, {
            contentType: newVideo.file.type || "video/mp4",
          });
        if (videoUploadError) {
          showToast(errorText("uploadFailed"), "error");
          return;
        }
        finalVideoPath = videoSlotResult.slot.path;
      }

      // اگر به هر دلیلی (مثلاً کاربر همین الان در همین لحظه عکسش را برداشته) هنوز عکس خودش را
      // ندارد، دوباره همان پیام روشن را نشان می‌دهیم — یک لایه‌ی محافظ دوم، سمت کلاینت، درست
      // قبل از فراخوانی سرور (که خودش هم دوباره همین را بررسی می‌کند).
      if (!finalPersonalPhotoPath) {
        showToast(errorText("personalPhotoRequired"), "error");
        return;
      }

      const result = await saveDriverProfileAction({
        vehicleType,
        province: province as string,
        vehicleDetails,
        contactPhone,
        personalPhotoPath: finalPersonalPhotoPath,
        vehiclePhotoPath: finalVehiclePhotoPath,
        videoPath: finalVideoPath,
      });

      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }

      showToast(isEditMode ? formDict.saveSuccessUpdate : formDict.saveSuccessCreate, "success");
      router.refresh();
    });
  }

  function handleToggleActive(nextValue: boolean) {
    const previousValue = isActive;
    setIsActive(nextValue);

    startTogglingActive(async () => {
      const result = await setDriverActiveStatusAction(nextValue);

      if (!result.success) {
        setIsActive(previousValue);
        showToast(errorText(result.error), "error");
        return;
      }

      showToast(
        nextValue ? formDict.activeToggleSuccessOn : formDict.activeToggleSuccessOff,
        "success"
      );
      router.refresh();
    });
  }

  useEffect(() => {
    if (!isActive) {
      setLocationTrackingStatus("idle");
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationTrackingStatus("unsupported");
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function sendLocation() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          setLocationTrackingStatus("active");
          updateDriverLocationAction(position.coords.latitude, position.coords.longitude).catch(
            () => {}
          );
          scheduleNext();
        },
        () => {
          if (cancelled) return;
          setLocationTrackingStatus("denied");
          scheduleNext();
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 1000 }
      );
    }

    function sendIfVisible() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        scheduleNext();
        return;
      }
      sendLocation();
    }

    function scheduleNext() {
      if (cancelled) return;
      const delayMs = (30 + Math.random() * 30) * 1000;
      timeoutId = setTimeout(sendIfVisible, delayMs);
    }

    function handleVisibilityChange() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (timeoutId) clearTimeout(timeoutId);
        sendLocation();
      }
    }

    sendLocation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-main text-center">{formDict.vehicleTypeSectionTitle}</h2>
        <IconCategoryPicker
          options={VEHICLE_TYPES.map((v) => ({
            id: v.id,
            label: vehicleTypesDict[v.dictKey],
            icon: <v.icon className="w-8 h-8" />,
          }))}
          value={vehicleType}
          onChange={(val) => setVehicleType(val as VehicleTypeId)}
        />
      </div>

      <Card className="p-5 flex flex-col">
        <Input
          label={formDict.vehicleDetailsLabel}
          placeholder={formDict.vehicleDetailsPlaceholder}
          value={vehicleDetails}
          onChange={(e) => setVehicleDetails(e.target.value)}
        />
        <div className="mb-4">
          <ProvinceSelectField
            value={province}
            onChange={setProvince}
            dict={dict.province}
            label={dict.province.fieldLabel}
          />
        </div>
        <Input
          label={formDict.contactPhoneLabel}
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          dir="ltr"
          inputMode="tel"
        />
      </Card>

      {/* بخش عکس‌ها — دو کارت مجزا و برچسب‌دار: عکس خودتان (الزامی) + عکس وسیله (اختیاری). */}
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-main text-center">{formDict.photosSectionTitle}</h2>
        <p className="text-sm text-text-muted text-center">{formDict.photosHint}</p>

        <div className="grid grid-cols-2 gap-3">
          <DriverPhotoSlot
            title={formDict.personalPhotoLabel}
            badgeLabel={formDict.requiredBadge}
            badgeColorClass="bg-red-50 text-red-500"
            previewUrl={
              newPersonalPhoto?.previewUrl ??
              (existingPersonalPhotoPath ? getDriverImageUrl(existingPersonalPhotoPath) : null)
            }
            isCompressing={isCompressingPersonal}
            onPick={(file) => handlePickPhoto("personal", file)}
            onRemove={() => handleRemovePhoto("personal")}
            addButtonLabel={formDict.addPersonalPhotoButton}
            removeLabel={formDict.removePhotoLabel}
            loadingLabel={dict.common.loading}
          />
          <DriverPhotoSlot
            title={formDict.vehiclePhotoLabel}
            badgeLabel={formDict.optionalBadge}
            badgeColorClass="bg-slate-100 text-text-muted"
            previewUrl={
              newVehiclePhoto?.previewUrl ??
              (existingVehiclePhotoPath ? getDriverImageUrl(existingVehiclePhotoPath) : null)
            }
            isCompressing={isCompressingVehicle}
            onPick={(file) => handlePickPhoto("vehicle", file)}
            onRemove={() => handleRemovePhoto("vehicle")}
            addButtonLabel={formDict.addVehiclePhotoButton}
            removeLabel={formDict.removePhotoLabel}
            loadingLabel={dict.common.loading}
          />
        </div>
      </div>

      {/* فاز ۱۱ — بخش ویدئو، فقط VIP. */}
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-main text-center">{formDict.videoSectionTitle}</h2>

        {!isVip ? (
          <VipUpsellNotice lang={lang} message={dict.vip.upsell.videoMessage} buttonLabel={dict.vip.upsell.button} />
        ) : newVideo ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-xs mx-auto w-full">
            <video src={newVideo.previewUrl} controls className="w-full aspect-video bg-black" />
            <button
              type="button"
              onClick={handleRemoveVideo}
              aria-label={formDict.removeVideoLabel}
              className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold"
            >
              ×
            </button>
          </div>
        ) : existingVideoPath ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-xs mx-auto w-full">
            <video
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/drivers-videos/${existingVideoPath}`}
              controls
              className="w-full aspect-video bg-black"
            />
            <button
              type="button"
              onClick={handleRemoveVideo}
              aria-label={formDict.removeVideoLabel}
              className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="max-w-xs mx-auto w-full aspect-video rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center gap-1.5 text-amber-600 cursor-pointer active:scale-95 transition-transform">
            <Icons.Camera className="w-6 h-6" />
            <span className="text-xs font-bold text-center px-2">{formDict.addVideoButton}</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                handleAddVideo(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {isEditMode && (
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-text-main text-sm">{formDict.activeToggleLabel}</span>
              <span className="text-xs text-text-muted leading-relaxed">
                {isActive ? formDict.currentlyActiveNotice : formDict.currentlyInactiveNotice}
              </span>
            </div>
            <Switch
              checked={isActive}
              onChange={handleToggleActive}
              disabled={isTogglingActive}
              label={formDict.activeToggleLabel}
            />
          </div>

          {isActive && locationTrackingStatus === "active" && (
            <p className="text-xs text-text-muted leading-relaxed">
              {formDict.locationTrackingActiveNotice}
            </p>
          )}
          {isActive && locationTrackingStatus === "denied" && (
            <p className="text-xs text-red-500 leading-relaxed">
              {formDict.locationTrackingDeniedNotice}
            </p>
          )}
          {isActive && locationTrackingStatus === "unsupported" && (
            <p className="text-xs text-red-500 leading-relaxed">
              {formDict.locationTrackingUnsupportedNotice}
            </p>
          )}
        </Card>
      )}

      {!isEditMode && (
        <div className="flex items-start gap-3 bg-bg-base rounded-2xl p-4">
          <Icons.Info className="w-5 h-5 shrink-0 text-text-muted mt-0.5" />
          <p className="text-sm text-text-muted">{formDict.inactiveByDefaultNotice}</p>
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        loading={isSubmitting || isCompressingPersonal || isCompressingVehicle}
        disabled={isSubmitting || isCompressingPersonal || isCompressingVehicle}
        onClick={handleSubmit}
      >
        {isEditMode ? formDict.submitButtonUpdate : formDict.submitButtonCreate}
      </Button>
    </div>
  );
}