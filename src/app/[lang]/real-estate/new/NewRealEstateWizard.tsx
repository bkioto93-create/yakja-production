// مسیر فایل: src/app/[lang]/real-estate/new/NewRealEstateWizard.tsx
// تسک ۴/۵ فاز ۰۵ — بخش تعاملی فرم گام‌به‌گام ثبت آگهی ملک، ۴ مرحله طبق متن دقیق تسک: ۱- نوع ملک با
// آیکون ← ۲- عکس ← ۳- قیمت/توضیح کوتاه ← ۴- تایید نهایی و انتشار. کاملاً هم‌الگو با
// src/app/[lang]/listings/new/NewListingWizard.tsx (فاز ۰۲، تسک ۴/۵).
//
// تفاوت‌های عمدی با ماژول کالا:
// ۱) بدون فیلد «عنوان» و بدون فیلد «شماره تماس» — چون جدول real_estate (تسک ۲ همین فاز) اصلاً
//    چنین ستون‌هایی ندارد؛ شماره تماس متقاضی، طبق طراحی آینده (تسک ۶)، از طریق owner_id در لحظه‌ی
//    نمایش جزئیات آگهی خوانده خواهد شد، نه این‌که در خودِ ردیف آگهی تکرار شود.
// ۲) مرحله‌ی ۱ علاوه بر «نوع ملک»، نوع معامله (فروش/اجاره) را هم مشخص می‌کند — اما نه همیشه با یک
//    پرسش جداگانه: طبق تصمیم طراحی ثبت‌شده در src/lib/realEstate/dealTypes.ts (تسک ۲)، برای
//    «فروش خانه»/«اجاره خانه»/«فروش زمین»/«باغ»، نوع معامله مستقیماً از روی نوع ملک انتخابی مشخص
//    است (چون در نامشان تصریح شده یا عملاً همیشه یک حالت دارند)؛ فقط برای «مغازه»/«سوله»/«سایر»
//    (که هم فروشی و هم اجاره‌ای معنا دارند) یک پرسش کوتاه اضافه («فروش یا اجاره؟») همان‌جا در
//    مرحله‌ی ۱ نمایش داده می‌شود — بدون افزودن مرحله‌ی جداگانه‌ی پنجم، دقیقاً طبق متن تسک («۴ مرحله»).
// ۳) به‌روزرسانی تسک ۵ (نسبت به تسک ۴): فشرده‌سازی تصویر سمت کلاینت حالا فعال است —
//    src/lib/realEstate/imageCompression.ts (دقیقاً هم‌الگو با src/lib/marketplace/imageCompression.ts،
//    فاز ۰۲، تسک ۵). هر عکس بلافاصله پس از انتخاب کاربر (نه در لحظه‌ی ارسال نهایی) فشرده می‌شود؛
//    وضعیت isCompressing حین این کار Stepper را مسدود نگه می‌دارد تا کاربر زودتر از موعد به مرحله‌ی
//    بعد نرود. آپلود نهایی همیشه با Content-Type ثابت image/jpeg انجام می‌شود، چون خروجی فشرده‌سازی
//    همیشه JPEG است (هم‌سو با ساده‌سازی createSignedUploadSlotsAction در actions.ts همین تسک).
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { IconCategoryPicker } from "@/components/ui/IconCategoryPicker";
import { Input } from "@/components/ui/Input";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { PROPERTY_TYPES, type PropertyTypeId } from "@/lib/realEstate/propertyTypes";
import { type DealTypeId } from "@/lib/realEstate/dealTypes";
import { compressImageFile, type CompressedImage } from "@/lib/realEstate/imageCompression";
import { sanitizePriceInput, toAsciiDigits } from "@/lib/marketplace/numbers";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { createSignedUploadSlotsAction, createRealEstateListingAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";
import { ProvinceSelectField } from "@/components/province/ProvinceSelectField";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const TOTAL_STEPS = 4;
const MIN_IMAGES = 1;
const MAX_IMAGES = 5;

// نوع معامله‌ی ضمنی هر نوع ملک؛ مقدار null یعنی «هم فروشی و هم اجاره‌ای معنا دارد» و باید از
// کاربر جداگانه پرسیده شود — دقیقاً طبق یادداشت طراحی dealTypes.ts (تسک ۲ همین فاز).
const IMPLIED_DEAL_TYPE: Record<PropertyTypeId, DealTypeId | null> = {
  house_sale: "sale",
  house_rent: "rent",
  land_sale: "sale",
  garden: "sale",
  shop: null,
  warehouse: null,
  other: null,
};

export function NewRealEstateWizard({ lang, dict }: { lang: Locale; dict: Dict }) {
  const router = useRouter();
  const { showToast } = useToast();
  const wizardDict = dict.realEstate.wizard;
  const errorsDict = wizardDict.errors as Record<string, string>;
  const propertyTypesDict = dict.realEstate.propertyTypes as Record<string, string>;

  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyTypeId | "">("");
  const [dealType, setDealType] = useState<DealTypeId | "">("");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();

  // تلاش خاموش و بدون‌اجبار برای گرفتن موقعیت مکانی، فقط هنگام رسیدن به مرحله‌ی تایید نهایی —
  // دقیقاً هم‌الگو با NewListingWizard.tsx (فاز ۰۲، تسک ۴).
  useEffect(() => {
    if (step !== 4 || coords || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, [step, coords]);

  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  const propertyTypeLabel = (id: string) => {
    const pt = PROPERTY_TYPES.find((p) => p.id === id);
    return pt ? propertyTypesDict[pt.dictKey] : id;
  };

  const dealTypeLabel = (id: string) =>
    id === "sale" ? wizardDict.dealTypeSale : id === "rent" ? wizardDict.dealTypeRent : "";

  function handleSelectPropertyType(id: string) {
    const selected = id as PropertyTypeId;
    setPropertyType(selected);
    const implied = IMPLIED_DEAL_TYPE[selected];
    setDealType(implied ?? "");
  }

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
    if (currentStep === 1) {
      if (!propertyType) {
        showToast(errorText("invalidPropertyType"), "error");
        return false;
      }
      if (!dealType) {
        showToast(errorText("invalidDealType"), "error");
        return false;
      }
    }
    if (currentStep === 2 && (images.length < MIN_IMAGES || images.length > MAX_IMAGES)) {
      showToast(errorText("invalidImageCount"), "error");
      return false;
    }
    if (currentStep === 3) {
      const priceNumber = Number(toAsciiDigits(price));
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        showToast(errorText("invalidPrice"), "error");
        return false;
      }
      if (!address.trim()) {
        showToast(errorText("invalidAddress"), "error");
        return false;
      }
      if (!province) {
        showToast(dict.province.fieldError, "error");
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
          .from("real-estate-images")
          .uploadToSignedUrl(slot.path, slot.token, images[i].blob, {
            contentType: "image/jpeg",
          });
        if (uploadError) {
          showToast(errorText("uploadFailed"), "error");
          return;
        }
        imagePaths.push(slot.path);
      }

      const result = await createRealEstateListingAction({
        propertyType: propertyType as string,
        dealType: dealType as string,
        province: province as string,
        price,
        address: address.trim(),
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
      router.push(`/${lang}/real-estate`);
    });
  }

  // آیا نوع ملک انتخاب‌شده نیاز به پرسش جداگانه‌ی «فروش یا اجاره؟» دارد؟
  const needsDealTypeQuestion = propertyType !== "" && IMPLIED_DEAL_TYPE[propertyType] === null;

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
            options={PROPERTY_TYPES.map((p) => ({
              id: p.id,
              label: propertyTypeLabel(p.id),
              icon: <p.icon className="w-8 h-8" />,
            }))}
            value={propertyType}
            onChange={handleSelectPropertyType}
          />

          {needsDealTypeQuestion && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-sm font-semibold text-text-main text-center">
                {wizardDict.dealTypeQuestion}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["sale", "rent"] as DealTypeId[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDealType(option)}
                    className={`min-h-[48px] rounded-2xl font-bold border-2 transition-all active:scale-95 ${
                      dealType === option
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 text-text-main opacity-80"
                    }`}
                  >
                    {dealTypeLabel(option)}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          <div className="mb-4">
            <ProvinceSelectField
              value={province}
              onChange={setProvince}
              dict={dict.province}
              label={dict.province.fieldLabel}
            />
          </div>
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
              <span className="text-text-muted">{wizardDict.propertyTypeLabel}</span>
              <span className="font-bold text-text-main">{propertyTypeLabel(propertyType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{wizardDict.dealTypeLabel}</span>
              <span className="font-bold text-text-main">{dealTypeLabel(dealType)}</span>
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
              <span className="text-text-muted">{dict.province.fieldLabel}</span>
              <span className="font-bold text-text-main">
                {/* رفع باگ: دقیقاً همان دلیل NewListingWizard.tsx — cast صریح لازم است. */}
                {province ? dict.province.names[province as keyof typeof dict.province.names] : ""}
              </span>
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