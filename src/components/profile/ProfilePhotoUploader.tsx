// مسیر فایل: src/components/profile/ProfilePhotoUploader.tsx
// عکس پروفایل کاربر — کارت مستقل «عکس پروفایل» در صفحه‌ی پروفایل. عمداً از کارت هویت حساب
// (که آواتار را با حلقه‌ی استوری نشان می‌دهد) جدا نگه داشته شده: آن آواتار یک هدف کلیک دارد
// (باز کردن Viewer استوری)؛ اگر همان‌جا آپلود عکس را هم فعال می‌کردیم، دو رفتار متفاوت روی یک
// هدف کلیک واحد تداخل پیدا می‌کرد. این کارت مستقل، خودش یک هدف کلیک روشن و بدون‌ابهام برای
// «تغییر عکس پروفایل» دارد.
//
// جریان کامل: انتخاب فایل → فشرده‌سازی (compressProfilePhoto: برش مربعی + کیفیت بالا، سمت
// مرورگر) → صدور آدرس آپلود امضاشده → آپلود مستقیم به Storage → ثبت نهایی
// (submitProfilePhotoAction، که خودکار وضعیت را 'pending' می‌کند؛ مگر برای خودِ ادمین که
// بلافاصله 'approved' می‌شود).
//
// **افزوده‌شده (دکمه‌ی حذف عکس پروفایل):** طبق درخواست صریح کارفرما — فارغ از این‌که ادمین عکس
// را تایید کرده یا نه، کاربر باید بتواند عکس خودش را کاملاً پاک کند. یک دکمه‌ی متنیِ کوچک زیرِ
// وضعیت عکس اضافه شد (فقط وقتی عکسی وجود دارد و در حال آپلود/فشرده‌سازی نیستیم)؛ قبل از اجرا یک
// تاییدِ ساده (window.confirm) می‌گیرد چون غیرقابل‌بازگشته. بعد از موفقیت، هم پیش‌نمایشِ محلی و
// هم وضعیت/عکسِ فعلی پاک می‌شود و کارت به حالتِ اولیه‌ی «هنوز عکسی نگذاشته‌ای» برمی‌گردد.
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
  deleteMyProfilePhotoAction,
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
  deleteButton: string;
  deleteConfirm: string;
  deleteSuccessMessage: string;
  deleteError: string;
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
  const [stage, setStage] = useState<"idle" | "compressing" | "uploading" | "deleting">("idle");
  // پیش‌نمایش محلی و خوش‌بینانه — بلافاصله بعد از فشرده‌سازی (حتی قبل از پایان آپلود) عکس تازه
  // را نشان می‌دهد، تا کاربر منتظر رفتن‌وبرگشتن به سرور برای دیدن چیزی که خودش انتخاب کرد نماند.
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  // بعد از حذفِ موفق، فوراً true می‌شود تا آواتار محلی هم بدون نیاز به منتظرِ router.refresh()
  // ماندن خالی شود — دقیقاً همان فلسفه‌ی خوش‌بینانه‌ی localPreviewUrl بالا، فقط برای حذف.
  const [locallyDeleted, setLocallyDeleted] = useState(false);

  const displayUrl = locallyDeleted ? null : (localPreviewUrl ?? currentPhotoUrl);
  const hasPhoto = Boolean(displayUrl);
  const isBusy = stage !== "idle";

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
      setLocallyDeleted(false);

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

  async function handleDeletePhoto() {
    if (isBusy || !hasPhoto) return;
    if (!window.confirm(dict.deleteConfirm)) return;

    setStage("deleting");
    try {
      const result = await deleteMyProfilePhotoAction();
      if (!result.success) {
        showToast(errorText(result.error) || dict.deleteError, "error");
        return;
      }

      setLocalPreviewUrl(null);
      setLocallyDeleted(true);
      showToast(dict.deleteSuccessMessage, "success");
      router.refresh();
    } catch {
      showToast(dict.deleteError, "error");
    } finally {
      setStage("idle");
    }
  }

  const statusText =
    !locallyDeleted && photoStatus === "pending"
      ? dict.statusPending
      : !locallyDeleted && photoStatus === "approved"
        ? dict.statusApproved
        : !locallyDeleted && photoStatus === "rejected"
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
        disabled={isBusy}
        aria-label={displayUrl ? dict.changeButton : dict.addButton}
        className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icons.User className="w-8 h-8" />
        )}
        {isBusy && (
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
        {stage === "compressing" || stage === "uploading" ? (
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

        {/* دکمه‌ی حذف — تا وقتی عکسی هست همیشه نمایش داده می‌شود (نه فقط وقتی بیکاریم)، وگرنه
            دقیقاً همان لحظه‌ای که کلیک می‌شود (stage تبدیل به "deleting" می‌شود) دکمه ناپدید
            می‌شد و اسپینرش هرگز دیده نمی‌شد. به‌جایش هنگام هر عملیاتِ دیگری (آپلود/فشرده‌سازی)
            فقط غیرفعال می‌شود. مستقل از وضعیتِ تایید: چه در انتظار، چه تاییدشده، چه ردشده، کاربر
            همیشه می‌تواند عکسِ خودش را کاملاً پاک کند. */}
        {hasPhoto && (
          <button
            type="button"
            onClick={handleDeletePhoto}
            disabled={isBusy}
            className="inline-flex items-center gap-1 text-xs font-bold text-red-500 w-fit active:text-red-600 disabled:opacity-50"
          >
            {stage === "deleting" ? (
              <Spinner className="w-3.5 h-3.5" label={dict.deleteButton} />
            ) : (
              <Icons.Trash className="w-3.5 h-3.5" />
            )}
            {dict.deleteButton}
          </button>
        )}
      </div>
    </Card>
  );
}