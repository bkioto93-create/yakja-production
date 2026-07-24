// مسیر فایل: src/app/[lang]/services/provider/ServiceProviderProfileClient.tsx
// تسک ۶ فاز ۰۴ — بخش تعاملی فرم ثبت/ویرایش پروفایل متخصص.
//
// **به‌روزرسانی (تصمیم محصول تایید‌شده توسط کارفرما، ۱۴۰۵/۰۴/۳۰):** یک بخش «گالری نمونه‌کار»
// اضافه شد — دقیقاً هم‌الگو با بخش عکسِ DriverProfileClient.tsx (که خودش هم‌الگو با
// NewListingWizard فاز ۰۲ است): گرید ۳ ستونه، فشرده‌سازی سمت کلاینت (نسخه‌ی services)، حداکثر ۵
// عکس، کاملاً اختیاری. برای این ماژول عکس اهمیت مضاعف دارد چون طبق ممیزی محصول، «نمونه‌کار» یکی
// از قوی‌ترین عامل‌های اعتمادسازی پیش از تماس با یک متخصص است (مشابه Thumbtack).
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconCategoryPicker } from "@/components/ui/IconCategoryPicker";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { getBuiltinIconComponent } from "@/lib/services/serviceCategoryIcons";
import { compressImageFile, type CompressedImage } from "@/lib/services/imageCompression";
import { getServiceProviderImageUrl } from "@/lib/services/images";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { ServiceCategory } from "@/lib/services/serviceCategories";
import { saveServiceProviderProfileAction, createServiceProviderSignedUploadSlotsAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { MyServiceProviderProfile } from "@/lib/services/serviceProviderQueries";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const MAX_IMAGES = 5;

export function ServiceProviderProfileClient({
  dict,
  lang,
  defaultContactPhone,
  existingProfile,
  categories,
}: {
  dict: Dict;
  lang: string;
  defaultContactPhone: string;
  existingProfile: MyServiceProviderProfile | null;
  categories: ServiceCategory[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formDict = dict.services.providerProfile;
  const errorsDict = formDict.errors as Record<string, string>;

  const isEditMode = !!existingProfile;
  const isHiddenByAdmin = !!existingProfile && existingProfile.isActive === false;

  const [serviceCategoryId, setServiceCategoryId] = useState(
    existingProfile?.serviceCategoryId ?? ""
  );
  const [address, setAddress] = useState(existingProfile?.address ?? "");
  const [contactPhone, setContactPhone] = useState(
    existingProfile?.contactPhone ?? defaultContactPhone
  );
  const [description, setDescription] = useState(existingProfile?.description ?? "");
  const [isSubmitting, startSubmitting] = useTransition();

  // گالری نمونه‌کار — دقیقاً هم‌الگو با بخش عکسِ DriverProfileClient.tsx.
  const [existingImages, setExistingImages] = useState<string[]>(existingProfile?.images ?? []);
  const [newImages, setNewImages] = useState<CompressedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const totalImagesCount = existingImages.length + newImages.length;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => {
        // رد دسترسی یا خطای گذرا؛ عمداً بی‌صدا نادیده گرفته می‌شود.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 1000 }
    );
  }, []);

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

  function handleSubmit() {
    if (!serviceCategoryId) {
      showToast(errorText("invalidCategory"), "error");
      return;
    }
    if (!address.trim()) {
      showToast(errorText("invalidAddress"), "error");
      return;
    }
    if (!contactPhone.trim()) {
      showToast(errorText("invalidPhone"), "error");
      return;
    }

    startSubmitting(async () => {
      const uploadedPaths: string[] = [];
      if (newImages.length > 0) {
        const slotsResult = await createServiceProviderSignedUploadSlotsAction(newImages.length);
        if (!slotsResult.success) {
          showToast(errorText(slotsResult.error), "error");
          return;
        }

        for (let i = 0; i < slotsResult.slots.length; i++) {
          const slot = slotsResult.slots[i];
          const { error: uploadError } = await supabaseBrowserClient.storage
            .from("service-providers-images")
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

      const result = await saveServiceProviderProfileAction({
        serviceCategoryId,
        address,
        contactPhone,
        description,
        imagePaths: [...existingImages, ...uploadedPaths],
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });

      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }

      showToast(isEditMode ? formDict.saveSuccessUpdate : formDict.saveSuccessCreate, "success");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {isHiddenByAdmin && (
        <div className="flex items-start gap-3 bg-red-50 rounded-2xl p-4">
          <Icons.AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-600">{formDict.hiddenByAdminNotice}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-text-main text-center">{formDict.categorySectionTitle}</h2>
        {categories.length > 0 ? (
          <IconCategoryPicker
            options={categories.map((cat) => {
              const BuiltinIcon = getBuiltinIconComponent(cat.iconKey);
              return {
                id: cat.id,
                label: lang === "ps" ? cat.namePs : cat.nameFa,
                icon:
                  cat.iconSource === "custom" && cat.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.iconUrl} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <BuiltinIcon className="w-8 h-8" />
                  ),
              };
            })}
            value={serviceCategoryId}
            onChange={setServiceCategoryId}
          />
        ) : (
          <Card className="p-6 text-center text-sm text-text-muted">
            {formDict.categoryEmptyNotice}
          </Card>
        )}
      </div>

      <Card className="p-5 flex flex-col">
        <Input
          label={formDict.addressLabel}
          placeholder={formDict.addressPlaceholder}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          label={formDict.contactPhoneLabel}
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          dir="ltr"
          inputMode="tel"
        />
        <div className="w-full mb-1">
          <label className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
            {formDict.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={formDict.descriptionPlaceholder}
            rows={3}
            className="block w-full bg-bg-base border border-slate-200 text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted resize-none"
          />
        </div>
      </Card>

      {/* گالری نمونه‌کار — کاملاً اختیاری، حداکثر ۵ عکس. */}
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
                src={getServiceProviderImageUrl(path)}
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

      {!isHiddenByAdmin && (
        <div className="flex items-start gap-3 bg-bg-base rounded-2xl p-4">
          <Icons.Info className="w-5 h-5 shrink-0 text-text-muted mt-0.5" />
          <p className="text-sm text-text-muted">{formDict.visibleImmediatelyNotice}</p>
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        loading={isSubmitting || isCompressing}
        disabled={isSubmitting || isCompressing || categories.length === 0}
        onClick={handleSubmit}
      >
        {isEditMode ? formDict.submitButtonUpdate : formDict.submitButtonCreate}
      </Button>
    </div>
  );
}

