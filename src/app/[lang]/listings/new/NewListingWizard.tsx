// مسیر فایل: src/app/[lang]/listings/new/NewListingWizard.tsx
// تسک ۴ فاز ۰۲ — بخش تعاملی فرم گام‌به‌گام ثبت آگهی، دقیقاً ۴ مرحله طبق بند ۲ سند راهبردی:
// ۱- دسته با آیکون ← ۲- عکس ← ۳- قیمت/توضیح کوتاه ← ۴- تایید نهایی و انتشار.
// موقعیت مکانی (GPS) عمداً در هیچ مرحله‌ی جداگانه‌ای درخواست نمی‌شود؛ فقط یک‌بار، خاموش و
// اختیاری، هنگام رسیدن به مرحله‌ی آخر گرفته می‌شود تا کاربر با درخواست دسترسی زودهنگام دلسرد
// نشود. اگر کاربر اجازه ندهد، ستون location طبق طراحی تسک ۲ همان null باقی می‌ماند.
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { IconCategoryPicker } from "@/components/ui/IconCategoryPicker";
import { Input } from "@/components/ui/Input";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { LISTING_CATEGORIES, type ListingCategoryId } from "@/lib/marketplace/categories";
import { compressImageFile, type CompressedImage } from "@/lib/marketplace/imageCompression";
import { sanitizePriceInput, toAsciiDigits } from "@/lib/marketplace/numbers";
import { normalizeAfghanPhone } from "@/lib/phone";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { createSignedUploadSlotsAction, createListingAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const TOTAL_STEPS = 4;
const MIN_IMAGES = 1;
const MAX_IMAGES = 5;

export function NewListingWizard({
  lang,
  dict,
  defaultContactPhone,
}: {
  lang: Locale;
  dict: Dict;
  defaultContactPhone: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const wizardDict = dict.marketplace.wizard;
  const errorsDict = wizardDict.errors as Record<string, string>;
  const categoriesDict = dict.marketplace.categories as Record<string, string>;

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ListingCategoryId | "">("");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState(defaultContactPhone);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();

  // تلاش خاموش و بدون‌اجبار برای گرفتن موقعیت مکانی، فقط هنگام رسیدن به مرحله‌ی تایید نهایی.
  useEffect(() => {
    if (step !== 4 || coords || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, [step, coords]);

  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  const categoryLabel = (id: string) => {
    const cat = LISTING_CATEGORIES.find((c) => c.id === id);
    return cat ? categoriesDict[cat.dictKey] : id;
  };

  async function handleAddImages(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    setIsCompressing(true);
    try {
      const compressed: CompressedImage[] = [];
      for (const file of filesToProcess) {
        compressed.push(await compressImageFile(file));
      }
      setImages((prev) => [...prev, ...compressed]);
    } catch {
      showToast(errorText("compressionFailed"), "error");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function validateStep(currentStep: number): boolean {
    if (currentStep === 1 && !category) {
      showToast(errorText("invalidCategory"), "error");
      return false;
    }
    if (currentStep === 2 && (images.length < MIN_IMAGES || images.length > MAX_IMAGES)) {
      showToast(errorText("invalidImageCount"), "error");
      return false;
    }
    if (currentStep === 3) {
      if (!title.trim()) {
        showToast(errorText("invalidTitle"), "error");
        return false;
      }
      const priceNumber = Number(toAsciiDigits(price));
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        showToast(errorText("invalidPrice"), "error");
        return false;
      }
      if (!address.trim()) {
        showToast(errorText("invalidAddress"), "error");
        return false;
      }
      if (!normalizeAfghanPhone(toAsciiDigits(contactPhone))) {
        showToast(errorText("invalidPhone"), "error");
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    if (step === TOTAL_STEPS) {
      handleSubmit();
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    startSubmitting(async () => {
      const slotsResult = await createSignedUploadSlotsAction(images.length);
      if (!slotsResult.success) {
        showToast(errorText(slotsResult.error), "error");
        return;
      }

      const imagePaths: string[] = [];
      for (let i = 0; i < slotsResult.slots.length; i++) {
        const slot = slotsResult.slots[i];
        const { error: uploadError } = await supabaseBrowserClient.storage
          .from("listings-images")
          .uploadToSignedUrl(slot.path, slot.token, images[i].blob, {
            contentType: "image/jpeg",
          });
        if (uploadError) {
          showToast(errorText("uploadFailed"), "error");
          return;
        }
        imagePaths.push(slot.path);
      }

      const result = await createListingAction({
        category: category as string,
        title: title.trim(),
        price,
        address: address.trim(),
        contactPhone,
        description,
        imagePaths,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }

      showToast(wizardDict.publishSuccess, "success");
      router.push(`/${lang}/listings`);
    });
  }

  return (
    <Stepper
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      onNext={handleNext}
      onBack={handleBack}
      busy={isCompressing || isSubmitting}
      texts={{
        next: dict.common.next,
        back: dict.common.back,
        submit: dict.common.submit,
        stepOf: dict.common.stepOf,
      }}
    >
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-text-main text-center">{wizardDict.step1Title}</h2>
          <IconCategoryPicker
            options={LISTING_CATEGORIES.map((c) => ({
              id: c.id,
              label: categoryLabel(c.id),
              icon: <c.icon className="w-8 h-8" />,
            }))}
            value={category}
            onChange={(val) => setCategory(val as ListingCategoryId)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-text-main text-center">{wizardDict.step2Title}</h2>
          <p className="text-sm text-text-muted text-center">{wizardDict.step2Hint}</p>

          <div className="grid grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  aria-label={wizardDict.removePhotoLabel}
                  className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold"
                >
                  ×
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-text-muted cursor-pointer active:scale-95 transition-transform">
                {isCompressing ? (
                  <Spinner className="w-6 h-6" label={dict.common.loading} />
                ) : (
                  <>
                    <Icons.Camera className="w-6 h-6" />
                    <span className="text-xs font-bold text-center px-1">{wizardDict.addPhotoButton}</span>
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
      )}

      {step === 3 && (
        <div className="flex flex-col">
          <h2 className="font-bold text-text-main text-center mb-4">{wizardDict.step3Title}</h2>
          <Input
            label={wizardDict.titleLabel}
            placeholder={wizardDict.titlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label={wizardDict.priceLabel}
            placeholder={wizardDict.pricePlaceholder}
            value={price}
            onChange={(e) => setPrice(sanitizePriceInput(e.target.value))}
            inputMode="decimal"
            dir="ltr"
          />
          <Input
            label={wizardDict.addressLabel}
            placeholder={wizardDict.addressPlaceholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label={wizardDict.contactPhoneLabel}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            dir="ltr"
            inputMode="tel"
          />
          <div className="w-full mb-4">
            <label className="block text-sm font-semibold text-text-main mb-1.5 ml-1">
              {wizardDict.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={wizardDict.descriptionPlaceholder}
              rows={3}
              className="block w-full bg-bg-base border border-slate-200 text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted resize-none"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-text-main text-center">{wizardDict.step4Title}</h2>
          <p className="text-sm text-text-muted text-center">{wizardDict.step4Hint}</p>

          <div className="bg-bg-base rounded-2xl p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">{wizardDict.titleLabel}</span>
              <span className="font-bold text-text-main">{title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{wizardDict.priceLabel}</span>
              <span className="font-bold text-text-main" dir="ltr">{price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{wizardDict.addressLabel}</span>
              <span className="font-bold text-text-main">{address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{wizardDict.contactPhoneLabel}</span>
              <span className="font-bold text-text-main" dir="ltr">{contactPhone}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {images.map((img, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={index} src={img.previewUrl} alt="" className="w-full aspect-square object-cover rounded-xl" />
            ))}
          </div>

          <p className="text-xs text-text-muted text-center mt-1">{wizardDict.locationNote}</p>
        </div>
      )}
    </Stepper>
  );
}

