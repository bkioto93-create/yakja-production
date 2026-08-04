// مسیر فایل: src/components/stories/AddStorySection.tsx
// قابلیت استوری — کارت «افزودن استوری» در صفحه‌ی پروفایل. جریان کامل کلاینت:
//   انتخاب فایل → فشرده‌سازی (processStoryMedia، سمت مرورگر) → صدور آدرس آپلود امضاشده →
//   آپلود مستقیم به Storage → ثبت نهایی ردیف در دیتابیس (createStoryAction).
//
// طبق تصمیم صریح کارفرما، محدودیت روزانه («کاربر معمولی روزی ۱ بار، VIP نامحدود») همیشه به‌طور
// برجسته کنار دکمه نمایش داده می‌شود — نه یک قانون پنهان که کاربر فقط بعد از خطا بفهمدش.
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import {
  processStoryMedia,
  isVideoCompressionSupported,
  STORY_VIDEO_MAX_DURATION_SECONDS,
} from "@/lib/stories/storyMediaProcessor";
import {
  createSignedStoryUploadSlotAction,
  createStoryAction,
} from "@/app/[lang]/profile/storyActions";

export type AddStorySectionDict = {
  title: string;
  description: string;
  addButton: string;
  dailyLimitNoteFreeTemplate: string; // شامل {used} و {limit}
  dailyLimitNoteVip: string;
  limitReachedTitle: string;
  limitReachedDesc: string;
  compressingLabel: string;
  uploadingLabel: string;
  videoTrimNoticeTemplate: string; // شامل {seconds}
  successMessage: string;
  errors: {
    unauthenticated: string;
    invalidMediaType: string;
    invalidMediaData: string;
    invalidVideoDuration: string;
    dailyLimitReached: string;
    uploadFailed: string;
    dbError: string;
    imageUnreadable: string;
    imageConversionFailed: string;
    canvasContextUnavailable: string;
    videoUnreadable: string;
    videoFileTooLarge: string;
    videoRecordingUnsupported: string;
    videoCompressionFailed: string;
    videoTooLargeAfterCompression: string;
    unsupportedFileType: string;
    generic: string;
  };
};

const STORIES_BUCKET = "stories";

export function AddStorySection({
  isVip,
  dailyUsedCount,
  dailyLimit,
  dict,
}: {
  isVip: boolean;
  dailyUsedCount: number;
  dailyLimit: number;
  dict: AddStorySectionDict;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"idle" | "compressing" | "uploading">("idle");
  const [progress, setProgress] = useState(0);

  const hasReachedLimit = !isVip && dailyUsedCount >= dailyLimit;
  const canPickVideo = isVideoCompressionSupported();

  function errorText(code: string): string {
    return dict.errors[code as keyof typeof dict.errors] ?? dict.errors.generic;
  }

  function handlePickClick() {
    if (hasReachedLimit || stage !== "idle") return;
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // پاک‌کردن مقدار input بلافاصله — تا اگر کاربر دوباره همان فایل را انتخاب کند، رویداد
    // change دوباره شلیک شود (مرورگرها برای «همان فایل، همان مسیر» رویداد change را دوباره
    // نمی‌فرستند مگر مقدار input قبلش خالی شده باشد).
    event.target.value = "";
    if (!file) return;

    setStage("compressing");
    setProgress(0);

    try {
      const compressed = await processStoryMedia(file, (ratio) => setProgress(ratio));

      setStage("uploading");
      const slotResult = await createSignedStoryUploadSlotAction({
        mediaType: compressed.mediaType,
        mimeType: compressed.mimeType,
      });
      if (!slotResult.success) {
        showToast(errorText(slotResult.error), "error");
        return;
      }

      const { error: uploadError } = await supabaseBrowserClient.storage
        .from(STORIES_BUCKET)
        .uploadToSignedUrl(slotResult.slot.path, slotResult.slot.token, compressed.blob, {
          contentType: compressed.mimeType,
        });
      if (uploadError) {
        showToast(errorText("uploadFailed"), "error");
        return;
      }

      const createResult = await createStoryAction({
        mediaPath: slotResult.slot.path,
        mediaType: compressed.mediaType,
        durationSeconds: compressed.durationSeconds,
        width: compressed.width,
        height: compressed.height,
      });
      if (!createResult.success) {
        showToast(errorText(createResult.error), "error");
        return;
      }

      showToast(dict.successMessage, "success");
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "generic";
      showToast(errorText(code), "error");
    } finally {
      setStage("idle");
      setProgress(0);
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div>
        <h2 className="font-extrabold text-text-main">{dict.title}</h2>
        <p className="text-sm text-text-muted mt-0.5">{dict.description}</p>
      </div>

      {isVip ? (
        <span className="text-xs font-bold text-amber-600 bg-amber-50 rounded-full px-3 py-1.5 w-fit">
          {dict.dailyLimitNoteVip}
        </span>
      ) : (
        <span
          className={`text-xs font-bold rounded-full px-3 py-1.5 w-fit ${
            hasReachedLimit ? "text-red-500 bg-red-50" : "text-primary bg-primary/10"
          }`}
        >
          {dict.dailyLimitNoteFreeTemplate
            .replace("{used}", String(dailyUsedCount))
            .replace("{limit}", String(dailyLimit))}
        </span>
      )}

      {hasReachedLimit ? (
        <div className="flex flex-col items-center text-center gap-1 py-2">
          <p className="text-sm font-bold text-text-main">{dict.limitReachedTitle}</p>
          <p className="text-xs text-text-muted">{dict.limitReachedDesc}</p>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={canPickVideo ? "image/*,video/*" : "image/*"}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handlePickClick}
            disabled={stage !== "idle"}
            className="flex items-center justify-center gap-2 min-h-[52px] rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {stage === "idle" ? (
              <>
                <Icons.Camera className="w-5 h-5" />
                {dict.addButton}
              </>
            ) : (
              <>
                <Spinner className="w-5 h-5" />
                {stage === "compressing"
                  ? `${dict.compressingLabel}${progress > 0 ? ` ${Math.round(progress * 100)}%` : ""}`
                  : dict.uploadingLabel}
              </>
            )}
          </button>
          {canPickVideo && (
            <p className="text-[11px] text-text-muted text-center">
              {dict.videoTrimNoticeTemplate.replace(
                "{seconds}",
                String(STORY_VIDEO_MAX_DURATION_SECONDS)
              )}
            </p>
          )}
        </>
      )}
    </Card>
  );
}