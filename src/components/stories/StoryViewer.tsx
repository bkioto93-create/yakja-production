// مسیر فایل: src/components/stories/StoryViewer.tsx
// قابلیت استوری — نمایشگر تمام‌صفحه، دقیقاً به الگوی رفتاری استوری اینستاگرام:
//   - نوارهای پیشرفت بالای صفحه (یک نوار به ازای هر استوری در دسته‌ی همان کاربر)
//   - عکس: مدت‌نمایش ثابت (STORY_IMAGE_DISPLAY_SECONDS) | ویدئو: مدت واقعی خودش
//   - تپ سمت راست = بعدی، تپ سمت چپ = قبلی — طبق قرارداد جهانی استوری (اینستاگرام/اسنپ‌چت)،
//     که عمداً برخلاف جهت RTL رابط کاربری فلیپ نمی‌شود؛ چون این حرکت با «جهت زمان» (راست=آینده/
//     جلوتر) گره خورده، نه با جهت متن — دقیقاً همان رفتاری که کاربران فارسی/پشتوزبانِ خودِ
//     اینستاگرام هم از قبل به آن عادت دارند.
//   - دکمه‌ی بستن (X) — و اگر بیننده خودِ صاحب استوری باشد، دکمه‌ی حذف زودهنگام هم کنارش.
"use client";

import { useEffect, useState, type SVGProps } from "react";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteMyStoryAction } from "@/app/[lang]/profile/storyActions";
import { STORY_IMAGE_DISPLAY_SECONDS } from "@/lib/stories/storyMediaProcessor";
import type { ActiveStory } from "@/lib/stories/storyQueries";

// آیکون سطل زباله به‌صورت محلی (نه از Icons.tsx مشترک) تعریف شده — چون مجموعه‌ی آیکون‌های
// دستی‌ساز پروژه (src/components/ui/Icons.tsx) هیچ آیکون «حذف/سطل زباله»ای ندارد و دست‌نخورده
// نگه‌داشتنِ یک فایل مشترکِ بزرگ و پرکاربرد امن‌تر از افزودن یک ورودی تازه به آن است.
function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      {...props}
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

export type StoryViewerDict = {
  closeLabel: string;
  deleteLabel: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  deleteConfirmYes: string;
  deleteConfirmCancel: string;
  deleteFailedError: string;
  justNow: string;
  minutesAgoTemplate: string; // شامل {minutes}
  hoursAgoTemplate: string; // شامل {hours}
};

function formatRelativeTime(createdAt: string, dict: StoryViewerDict): string {
  const diffMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMinutes < 1) return dict.justNow;
  if (diffMinutes < 60) return dict.minutesAgoTemplate.replace("{minutes}", String(diffMinutes));
  const diffHours = Math.floor(diffMinutes / 60);
  return dict.hoursAgoTemplate.replace("{hours}", String(diffHours));
}

function storyDurationSeconds(story: ActiveStory): number {
  if (story.mediaType === "video") return story.durationSeconds || STORY_IMAGE_DISPLAY_SECONDS;
  return STORY_IMAGE_DISPLAY_SECONDS;
}

function ProgressSegment({
  status,
  durationSeconds,
}: {
  status: "done" | "active" | "upcoming";
  durationSeconds: number;
}) {
  const [filled, setFilled] = useState(status === "done");

  useEffect(() => {
    if (status !== "active") {
      setFilled(status === "done");
      return;
    }
    setFilled(false);
    const raf = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(raf);
  }, [status]);

  return (
    <div className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
      <div
        className="h-full bg-white rounded-full"
        style={{
          width: filled ? "100%" : "0%",
          transition: status === "active" ? `width ${durationSeconds}s linear` : "none",
        }}
      />
    </div>
  );
}

export function StoryViewer({
  stories,
  ownerName,
  isOwnStories,
  onClose,
  onDeleted,
  dict,
}: {
  stories: ActiveStory[];
  ownerName: string;
  isOwnStories: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  dict: StoryViewerDict;
}) {
  const { showToast } = useToast();
  const [localStories, setLocalStories] = useState(stories);
  const [index, setIndex] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentStory = localStories[index];

  function goNext() {
    setIndex((current) => {
      if (current >= localStories.length - 1) {
        onClose();
        return current;
      }
      return current + 1;
    });
  }

  function goPrev() {
    setIndex((current) => Math.max(0, current - 1));
  }

  // پیشروی خودکار — برای عکس با یک تایمر ثابت؛ برای ویدئو، پیشروی واقعی با رویداد onEnded خودِ
  // تگ <video> کنترل می‌شود (دقیق‌تر از یک تایمر ثابت)، این افکت فقط یک تایمر پشتیبان (fallback)
  // اضافه می‌کند برای موردی که به‌هر دلیلی onEnded شلیک نشود.
  useEffect(() => {
    if (!currentStory) return;
    const duration = storyDurationSeconds(currentStory);
    const isFallback = currentStory.mediaType === "video";
    const timer = setTimeout(goNext, (duration + (isFallback ? 1 : 0)) * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, currentStory?.id]);

  if (!currentStory) return null;

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const result = await deleteMyStoryAction(currentStory.id);
    setIsDeleting(false);
    setConfirmingDelete(false);

    if (!result.success) {
      showToast(dict.deleteFailedError, "error");
      return;
    }

    const remaining = localStories.filter((s) => s.id !== currentStory.id);
    onDeleted?.();
    if (remaining.length === 0) {
      onClose();
      return;
    }
    setLocalStories(remaining);
    setIndex((current) => Math.min(current, remaining.length - 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden">
        <div className="absolute inset-0">
          {currentStory.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              onEnded={goNext}
            />
          )}
        </div>

        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        <div className="absolute top-3 inset-x-3 flex gap-1">
          {localStories.map((story, i) => (
            <ProgressSegment
              key={story.id}
              status={i < index ? "done" : i === index ? "active" : "upcoming"}
              durationSeconds={storyDurationSeconds(story)}
            />
          ))}
        </div>

        <div className="absolute top-7 inset-x-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-white text-sm truncate drop-shadow">{ownerName}</span>
            <span className="text-white/70 text-xs shrink-0">
              {formatRelativeTime(currentStory.createdAt, dict)}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOwnStories && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={dict.deleteLabel}
                className="w-9 h-9 flex items-center justify-center text-white/90 active:scale-90 transition-transform"
              >
                <TrashIcon className="w-[18px] h-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.closeLabel}
              className="w-9 h-9 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* تپ‌زون‌های ناوبری — راست=بعدی (۷۰٪ عرض)، چپ=قبلی (۳۰٪ عرض)، عمداً بدون فلیپ RTL
            (رجوع کنید به یادداشت بالای فایل). */}
        <button
          type="button"
          onClick={goNext}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 w-[70%] focus:outline-none"
        />
        <button
          type="button"
          onClick={goPrev}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-y-0 left-0 w-[30%] focus:outline-none"
        />
      </div>

      {confirmingDelete && (
        <div
          className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center p-6"
          onClick={() => !isDeleting && setConfirmingDelete(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-xs flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-text-main">{dict.deleteConfirmTitle}</h3>
            <p className="text-sm text-text-muted">{dict.deleteConfirmDesc}</p>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 font-bold text-text-main disabled:opacity-60"
              >
                {dict.deleteConfirmCancel}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isDeleting ? <Spinner className="w-4 h-4" /> : dict.deleteConfirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}