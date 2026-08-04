// مسیر فایل: src/components/stories/UserStoryAvatar.tsx
// قابلیت استوری — کامپوننت «آماده‌ی استفاده» که سه چیز را با هم ترکیب می‌کند: حلقه‌ی هایلایت
// (StoryRing)، فچ‌کردن دسته‌ی استوری‌های آن کاربر فقط وقتی کلیک شد (نه زودتر — تا هیچ فچ اضافه‌ای
// برای کاربرهایی که هرگز کلیک نمی‌شوند انجام نشود)، و باز/بسته‌کردن Viewer تمام‌صفحه.
//
// این همان کامپوننتی است که طراحی شده تا در آینده با یک import ساده به هر جای دیگر اپ (کارت
// آگهی، کارت راننده/متخصص و ...) هم اضافه شود — امروز فقط در پروفایل و ردیف صفحه‌ی اصلی
// استفاده می‌شود.
"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/ToastProvider";
import { StoryRing } from "@/components/stories/StoryRing";
import { StoryViewer, type StoryViewerDict } from "@/components/stories/StoryViewer";
import { getUserStoriesAction } from "@/app/[lang]/profile/storyActions";
import type { ActiveStory } from "@/lib/stories/storyQueries";

export function UserStoryAvatar({
  userId,
  ownerName,
  hasActiveStory,
  isOwnStories,
  size = 64,
  ariaLabel,
  loadErrorMessage,
  viewerDict,
  children,
}: {
  userId: string;
  ownerName: string;
  hasActiveStory: boolean;
  isOwnStories: boolean;
  size?: number;
  ariaLabel?: string;
  // پیامی که اگر لحظه‌ی کلیک، استوری دیگر فعال نبود (مثلاً همان لحظه منقضی شد) به‌عنوان toast
  // خطا نشان داده می‌شود.
  loadErrorMessage: string;
  viewerDict: StoryViewerDict;
  children: ReactNode;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [openStories, setOpenStories] = useState<ActiveStory[] | null>(null);

  async function handleClick() {
    if (!hasActiveStory || isLoading) return;
    setIsLoading(true);
    try {
      const stories = await getUserStoriesAction(userId);
      if (stories.length === 0) {
        showToast(loadErrorMessage, "error");
        return;
      }
      setOpenStories(stories);
    } catch {
      showToast(loadErrorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <StoryRing
        hasActiveStory={hasActiveStory}
        onClick={hasActiveStory ? handleClick : undefined}
        size={size}
        ariaLabel={ariaLabel}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Icons.User className="w-1/2 h-1/2 text-primary opacity-40" />
          </div>
        ) : (
          children
        )}
      </StoryRing>

      {openStories && (
        <StoryViewer
          stories={openStories}
          ownerName={ownerName}
          isOwnStories={isOwnStories}
          onClose={() => setOpenStories(null)}
          onDeleted={() => router.refresh()}
          dict={viewerDict}
        />
      )}
    </>
  );
}