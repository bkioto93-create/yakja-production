// مسیر فایل: src/components/profile/ProfilePhotoUploader.tsx
// عکس پروفایل کاربر — کارت مستقل «عکس پروفایل» در صفحه‌ی پروفایل. عمداً از کارت هویت حساب
// (که آواتار را با حلقه‌ی استوری نشان می‌دهد) جدا نگه داشته شده: آن آواتار یک هدف کلیک دارد
// (باز کردن Viewer استوری)؛ اگر همان‌جا آپلود عکس را هم فعال می‌کردیم، دو رفتار متفاوت روی یک
// هدف کلیک واحد تداخل پیدا می‌کرد. این کارت مستقل، خودش یک هدف کلیک روشن و بدون‌ابهام برای
// «تغییر عکس پروفایل» دارد.
//
// جریان کامل: انتخاب فایل → فشرده‌سازی (compressProfilePhoto: برش مربعی + کیفیت بالا، سمت
// مرورگر) → صدور آدرس آپلود امضاشده → آپلود مستقیم به Storage → ثبت نهایی
// (submitProfilePhotoAction، که خودکار وضعیت را 'pending' می‌کند).
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { compressProfilePhoto } from "@/lib/users/profilePhotoCompression";
import {
  createSignedProfilePhotoUploadSlotAction,
  submitProfilePhotoAction,
} from "@/app/[lang]/profile/photoActions";

export type ProfilePhotoUploaderDict = {
  title: string;
  description: string;
  changeButton: string;
  addButton: string;
  compressingLabel: string;
  uploadingLabel: string;
  successMessage: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  errors: {
    unauthenticated: string;
    invalidPhotoData: string;
    uploadFailed: string;
    dbError: string;
    imageUnreadable: string;
    imageConversionFailed: string;
    canvasContextUnavailable: string;
    generic: string;
  };
};

const PROFILE_PHOTOS_BUCKET = "profile-photos";

export function ProfilePhotoUploader({
  currentPhotoUrl,
  photoStatus,
  dict,
}: {
  currentPhotoUrl: string | null;
  photoStatus: "pending" | "approved" | "rejected" | null;
  dict: ProfilePhotoUploaderDict;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"idle" | "compressing" | "uploading">("idle");
  // پیش‌نمایش محلی و خوش‌بینانه — بلافاصله بعد از فشرده‌سازی (حتی قبل از پایان آپلود) عکس تازه
  // را نشان می‌دهد، تا کاربر منتظر رفتن‌وبرگشتن به سرور برای دیدن چیزی که خودش انتخاب کرد نماند.
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const displayUrl = localPreviewUrl ?? currentPhotoUrl;

  function errorText(code: string): string {
    return dict.errors[code as keyof typeof dict.errors] ?? dict.errors.generic;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStage("compressing");
    try {
      const compressed = await compressProfilePhoto(file);
      setLocalPreviewUrl(compressed.previewUrl);

      setStage("uploading");
      const slotResult = await createSignedProfilePhotoUploadSlotAction();
      if (!slotResult.success) {
        showToast(errorText(slotResult.error), "error");
        return;
      }

      const { error: uploadError } = await supabaseBrowserClient.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .uploadToSignedUrl(slotResult.slot.path, slotResult.slot.token, compressed.blob, {
          contentType: "image/jpeg",
        });
      if (uploadError) {
        showToast(errorText("uploadFailed"), "error");
        return;
      }

      const submitResult = await submitProfilePhotoAction(slotResult.slot.path);
      if (!submitResult.success) {
        showToast(errorText(submitResult.error), "error");
        return;
      }

      showToast(dict.successMessage, "success");
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "generic";
      showToast(errorText(code), "error");
    } finally {
      setStage("idle");
    }
  }

  const statusText =
    photoStatus === "pending"
      ? dict.statusPending
      : photoStatus === "approved"
        ? dict.statusApproved
        : photoStatus === "rejected"
          ? dict.statusRejected
          : null;

  const statusColorClass =
    photoStatus === "approved"
      ? "text-emerald-600 bg-emerald-50"
      : photoStatus === "rejected"
        ? "text-red-500 bg-red-50"
        : "text-amber-600 bg-amber-50";

  return (
    <Card className="p-5 flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={stage !== "idle"}
        aria-label={displayUrl ? dict.changeButton : dict.addButton}
        className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icons.User className="w-8 h-8" />
        )}
        {stage !== "idle" && (
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Spinner className="w-5 h-5 text-white" />
          </span>
        )}
        <span className="absolute bottom-0 inset-x-0 h-5 bg-black/50 flex items-center justify-center">
          <Icons.Camera className="w-3 h-3 text-white" />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <h2 className="font-extrabold text-text-main">{dict.title}</h2>
        <p className="text-xs text-text-muted">{dict.description}</p>
        {stage !== "idle" ? (
          <span className="text-xs font-bold text-primary w-fit">
            {stage === "compressing" ? dict.compressingLabel : dict.uploadingLabel}
          </span>
        ) : (
          statusText && (
            <span className={`text-xs font-bold rounded-full px-2.5 py-1 w-fit ${statusColorClass}`}>
              {statusText}
            </span>
          )
        )}
      </div>
    </Card>
  );
}