// مسیر فایل: src/app/[lang]/transport/driver/DriverProfileClient.tsx
// تسک ۴ فاز ۰۳ — بخش تعاملی فرم ثبت/ویرایش پروفایل راننده.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** یک بخش «عکس‌ها» به فرم اضافه
// شد — دقیقاً هم‌الگو با مرحله‌ی عکسِ NewListingWizard.tsx (فاز ۰۲): گرید ۳ ستونه، فشرده‌سازی
// سمت کلاینت با compressImageFile (نسخه‌ی transport)، حداکثر ۵ عکس. برخلاف ثبت آگهی، اینجا عکس
// کاملاً اختیاری است (راننده می‌تواند بدون هیچ عکسی هم پروفایلش را ثبت کند). عکس‌های موجود (در
// حالت ویرایش) با getDriverImageUrl نمایش داده می‌شوند و هرکدام قابل حذف است؛ عکس‌های تازه ابتدا
// فشرده و پیش‌نمایش می‌شوند و فقط هنگام ذخیره‌ی نهایی فرم، با createDriverSignedUploadSlotsAction
// آپلود می‌شوند — دقیقاً همان جریان دو-مرحله‌ای آگهی کالا (فاز ۰۲).
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
  createDriverSignedUploadSlotsAction,
  createDriverSignedVideoUploadSlotAction,
} from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";
import type { MyDriverProfile } from "@/lib/transport/driverQueries";
import { ProvinceSelectField } from "@/components/province/ProvinceSelectField";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const MAX_IMAGES = 5;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

type LocationTrackingStatus = "idle" | "active" | "denied" | "unsupported";

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

  // عکس‌های از قبل ذخیره‌شده (حالت ویرایش) — آرایه‌ای از مسیر فایل، نه بایت تصویر.
  const [existingImages, setExistingImages] = useState<string[]>(existingProfile?.images ?? []);
  // عکس‌های تازه‌ی انتخاب‌شده در همین جلسه — فقط هنگام ذخیره‌ی فرم آپلود می‌شوند.
  const [newImages, setNewImages] = useState<CompressedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const totalImagesCount = existingImages.length + newImages.length;

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

  async function handleAddImages(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remainingSlots = MAX_IMAGES - totalImagesCount;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    setIsCompressing(true);
    try {
      const compressed: CompressedImage[] = [];
      for (const file of filesToProcess) {
        compressed.push(await compressImageFile(file));
      }
      setNewImages((prev) => [...prev, ...compressed]);
    } catch {
      showToast(errorText("compressionFailed"), "error");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleRemoveExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoveNewImage(index: number) {
    setNewImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
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

    startSubmitting(async () => {
      // آپلود عکس‌های تازه (اگر وجود داشته باشند) — دقیقاً هم‌جریان NewListingWizard (فاز ۰۲).
      const uploadedPaths: string[] = [];
      if (newImages.length > 0) {
        const slotsResult = await createDriverSignedUploadSlotsAction(newImages.length);
        if (!slotsResult.success) {
          showToast(errorText(slotsResult.error), "error");
          return;
        }

        for (let i = 0; i < slotsResult.slots.length; i++) {
          const slot = slotsResult.slots[i];
          const { error: uploadError } = await supabaseBrowserClient.storage
            .from("drivers-images")
            .uploadToSignedUrl(slot.path, slot.token, newImages[i].blob, {
              contentType: "image/jpeg",
            });
          if (uploadError) {
            showToast(errorText("uploadFailed"), "error");
            return;
          }
          uploadedPaths.push(slot.path);
        }
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

      const result = await saveDriverProfileAction({
        vehicleType,
        province: province as string,
        vehicleDetails,
        contactPhone,
        imagePaths: [...existingImages, ...uploadedPaths],
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

      {/* بخش عکس‌ها — کاملاً اختیاری، حداکثر ۵ عکس (خودِ راننده + وسیله). */}
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-main text-center">{formDict.photosSectionTitle}</h2>
        <p className="text-sm text-text-muted text-center">{formDict.photosHint}</p>

        <div className="grid grid-cols-3 gap-3">
          {existingImages.map((path, index) => (
            <div
              key={`existing-${path}`}
              className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getDriverImageUrl(path)}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveExistingImage(index)}
                aria-label={formDict.removePhotoLabel}
                className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold"
              >
                ×
              </button>
            </div>
          ))}

          {newImages.map((img, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveNewImage(index)}
                aria-label={formDict.removePhotoLabel}
                className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold"
              >
                ×
              </button>
            </div>
          ))}

          {totalImagesCount < MAX_IMAGES && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-text-muted cursor-pointer active:scale-95 transition-transform">
              {isCompressing ? (
                <Spinner className="w-6 h-6" label={dict.common.loading} />
              ) : (
                <>
                  <Icons.Camera className="w-6 h-6" />
                  <span className="text-xs font-bold text-center px-1">{formDict.addPhotoButton}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                disabled={isCompressing}
                onChange={(e) => {
                  handleAddImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
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
        loading={isSubmitting || isCompressing}
        disabled={isSubmitting || isCompressing}
        onClick={handleSubmit}
      >
        {isEditMode ? formDict.submitButtonUpdate : formDict.submitButtonCreate}
      </Button>
    </div>
  );
}