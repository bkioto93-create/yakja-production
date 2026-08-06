// مسیر فایل: src/app/[lang]/stories/AllStoriesClient.tsx
// صفحه‌ی «همه استوری‌ها» — بخش تعاملی (شبکه‌ی استوری‌ها + بارگذاری تدریجی + Viewer تمام‌صفحه).
//
// **بارگذاری تدریجی (بند صریح کارفرما درباره‌ی اینترنت ضعیف در افغانستان):** هرگز همه‌ی
// استوری‌ها با هم لود نمی‌شوند. دسته‌ی اول سمت سرور رندر می‌شود (پس صفحه فوراً و حتی پیش از
// اجرای جاوااسکریپت محتوا دارد) و بقیه با اسکرول‌کردنِ کاربر، دسته‌دسته می‌آیند:
//   ۱) **IntersectionObserver:** یک نگهبانِ نامرئی انتهای فهرست؛ به‌محض نزدیک‌شدن کاربر، دسته‌ی
//      بعدی خودکار درخواست می‌شود — بدون نیاز به هیچ کلیکی.
//   ۲) **دکمه‌ی پشتیبان «نمایش بیشتر»:** اگر مرورگر کاربر از IntersectionObserver پشتیبانی
//      نکند (مرورگرهای خیلی قدیمی، که در بازار هدف کم نیستند) یا درخواست خودکار شکست بخورد،
//      کاربر همچنان راه دستی دارد. یعنی صفحه هرگز به بن‌بست نمی‌رسد.
//
// **یکتاسازی سمت کلاینت:** سرور فقط داخل هر دسته بر اساس صاحب استوری یکتاسازی می‌کند (نمی‌داند
// کلاینت قبلاً چه دیده). پس اینجا هنگام چسباندن هر دسته‌ی تازه، یک‌بار دیگر بر اساس ownerId
// یکتاسازی می‌شود تا هیچ کاربری دوبار در شبکه ظاهر نشود.
//
// **زنجیره‌ی Viewer:** دقیقاً مثل ردیف صفحه‌ی اصلی (StoriesShowcase) — با «بعدی» در آخرین
// استوریِ یک نفر، می‌رود سراغ نفر بعدیِ همین شبکه، نه این‌که بسته شود.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { Icons } from "@/components/ui/Icons";
import { StoryRing } from "@/components/stories/StoryRing";
import { StoryViewer, type StoryViewerDict } from "@/components/stories/StoryViewer";
import { getUserStoriesAction } from "@/app/[lang]/profile/storyActions";
import { loadMoreStoriesAction } from "@/app/[lang]/stories/actions";
import type { ActiveStory } from "@/lib/stories/storyQueries";
import type { HomeStoryPreview } from "@/lib/home/homeQueries";

export type AllStoriesPageDict = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDesc: string;
  loadMore: string;
  loadingMore: string;
  endOfList: string;
  loadMoreError: string;
};

export function AllStoriesClient({
  initialItems,
  initialCursor,
  viewerId,
  dict,
  ownerFallbackName,
  ringAriaLabelTemplate,
  loadErrorMessage,
  viewerDict,
}: {
  initialItems: HomeStoryPreview[];
  initialCursor: string | null;
  viewerId: string | null;
  dict: AllStoriesPageDict;
  ownerFallbackName: string;
  ringAriaLabelTemplate: string;
  loadErrorMessage: string;
  viewerDict: StoryViewerDict;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [items, setItems] = useState<HomeStoryPreview[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Viewer — هم‌منطق با StoriesShowcase صفحه‌ی اصلی.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [openStories, setOpenStories] = useState<ActiveStory[] | null>(null);
  const [openInitialIndex, setOpenInitialIndex] = useState<number | "last">(0);
  const [isOpening, setIsOpening] = useState(false);

  const cacheRef = useRef<Record<string, ActiveStory[]>>({});
  // جلوگیری از ارسال هم‌زمانِ چند درخواستِ «دسته‌ی بعدی» (مثلاً وقتی نگهبان و دکمه با هم شلیک
  // می‌کنند). یک ref است نه state، چون تغییرش نباید رندر مجدد بدهد.
  const isFetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || cursor === null) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await loadMoreStoriesAction(cursor);

      setItems((previous) => {
        const seen = new Set(previous.map((item) => item.ownerId));
        const fresh = page.items.filter((item) => !seen.has(item.ownerId));
        return fresh.length === 0 ? previous : [...previous, ...fresh];
      });
      setCursor(page.nextCursor);
    } catch {
      showToast(dict.loadMoreError, "error");
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [cursor, dict.loadMoreError, showToast]);

  // نگهبانِ نامرئیِ انتهای فهرست — به‌محض دیده‌شدن، دسته‌ی بعدی را می‌گیرد.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || cursor === null) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      // ۴۰۰px زودتر از رسیدنِ واقعی شروع می‌کند تا روی اینترنت کند، دسته‌ی بعدی معمولاً پیش از
      // رسیدنِ کاربر به انتهای فهرست آماده شده باشد و پرشی حس نشود.
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  async function fetchStoriesFor(ownerId: string): Promise<ActiveStory[]> {
    if (cacheRef.current[ownerId]) return cacheRef.current[ownerId];
    const result = await getUserStoriesAction(ownerId);
    cacheRef.current[ownerId] = result;
    return result;
  }

  async function handleOpen(index: number) {
    setIsOpening(true);
    try {
      const stories = await fetchStoriesFor(items[index].ownerId);
      if (stories.length === 0) {
        showToast(loadErrorMessage, "error");
        return;
      }
      setOpenIndex(index);
      setOpenStories(stories);
      setOpenInitialIndex(0);
    } catch {
      showToast(loadErrorMessage, "error");
    } finally {
      setIsOpening(false);
    }
  }

  // پیش‌بارگذاری همسایه‌ها — همان تکنیک صفحه‌ی اصلی، برای جابه‌جایی بدون مکث.
  useEffect(() => {
    if (openIndex === null) return;
    for (const i of [openIndex - 1, openIndex + 1]) {
      if (i < 0 || i >= items.length) continue;
      const ownerId = items[i].ownerId;
      if (!cacheRef.current[ownerId]) void fetchStoriesFor(ownerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  async function handleRequestNext() {
    if (openIndex === null) return;
    for (let i = openIndex + 1; i < items.length; i++) {
      const stories = await fetchStoriesFor(items[i].ownerId);
      if (stories.length > 0) {
        setOpenIndex(i);
        setOpenStories(stories);
        setOpenInitialIndex(0);
        return;
      }
    }
    handleClose();
  }

  async function handleRequestPrevious() {
    if (openIndex === null) return;
    for (let i = openIndex - 1; i >= 0; i--) {
      const stories = await fetchStoriesFor(items[i].ownerId);
      if (stories.length > 0) {
        setOpenIndex(i);
        setOpenStories(stories);
        setOpenInitialIndex("last");
        return;
      }
    }
  }

  function handleClose() {
    setOpenIndex(null);
    setOpenStories(null);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-20 px-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full border-2 border-dashed border-primary/40" />
        </div>
        <h2 className="font-extrabold text-lg text-text-main">{dict.emptyTitle}</h2>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">{dict.emptyDesc}</p>
      </div>
    );
  }

  const openItem = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      {/* شبکه‌ی استوری‌ها — تعداد ستون‌ها با عرض صفحه بالا می‌رود تا در دسکتاپ فضای خالی نماند. */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-x-3 gap-y-6">
        {items.map((story, index) => {
          const displayName = story.ownerName?.trim() ? story.ownerName : ownerFallbackName;
          return (
            <div key={story.storyId} className="contents">
              <div className="flex flex-col items-center gap-2 min-w-0">
                <StoryRing
                  hasActiveStory={true}
                  onClick={() => handleOpen(index)}
                  size={78}
                  ariaLabel={ringAriaLabelTemplate.replace("{name}", displayName)}
                  variant={story.isOfficial ? "official" : "default"}
                  badge={
                    story.isOfficial ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white ring-2 ring-white">
                        <Icons.CheckCircle className="w-3 h-3" />
                      </span>
                    ) : undefined
                  }
                >
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 overflow-hidden">
                    {story.mediaType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={story.mediaUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={story.mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </StoryRing>
                <span className="text-[11px] font-bold text-text-main text-center truncate w-full px-0.5">
                  {displayName}
                </span>
              </div>

              {/* جداکننده‌ی خاصِ استوریِ رسمی — چون این صفحه شبکه‌ای (Grid) است نه ریلِ افقی،
                  جداکننده هم یک خطِ افقیِ کاملاً عرض‌گیر است (col-span-full) که خودش را در یک
                  ردیفِ مستقلِ Grid جا می‌کند؛ دقیقاً بعد از استوریِ سنجاق‌شده‌ی مدیریت (که طبق
                  storyQueries.ts همیشه اولین آیتم است، اگر وجود داشته باشد). */}
              {story.isOfficial && index === 0 && items.length > 1 && (
                <div
                  aria-hidden="true"
                  className="col-span-full h-px my-1 rounded-full bg-gradient-to-l from-transparent via-slate-200 to-transparent"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* نگهبانِ نامرئیِ بارگذاری خودکار */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      {/* وضعیت انتهای فهرست: یا در حال بارگذاری، یا دکمه‌ی پشتیبان، یا پیام «تمام شد» */}
      <div className="flex flex-col items-center justify-center gap-3 pt-10 pb-2">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-sm font-bold text-text-muted">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            {dict.loadingMore}
          </div>
        )}

        {!isLoadingMore && cursor !== null && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="rounded-full bg-primary/10 text-primary font-extrabold text-sm px-6 h-11 active:scale-95 md:hover:bg-primary/15 transition-all"
          >
            {dict.loadMore}
          </button>
        )}

        {cursor === null && (
          <p className="text-xs font-semibold text-text-muted">{dict.endOfList}</p>
        )}
      </div>

      {isOpening && openIndex === null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {openItem && openStories && (
        <StoryViewer
          key={openItem.ownerId}
          stories={openStories}
          ownerName={openItem.ownerName?.trim() ? openItem.ownerName : ownerFallbackName}
          isOwnStories={viewerId === openItem.ownerId}
          onClose={handleClose}
          onDeleted={() => router.refresh()}
          dict={viewerDict}
          initialIndex={openInitialIndex}
          hasNextUser={openIndex !== null && openIndex < items.length - 1}
          hasPreviousUser={openIndex !== null && openIndex > 0}
          onRequestNextUser={handleRequestNext}
          onRequestPreviousUser={handleRequestPrevious}
        />
      )}
    </>
  );
}