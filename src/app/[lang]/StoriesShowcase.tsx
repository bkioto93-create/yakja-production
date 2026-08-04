// مسیر فایل: src/app/[lang]/StoriesShowcase.tsx
// قابلیت استوری — ردیف «تازه‌ترین استوری‌ها»ی صفحه‌ی اصلی. طبق درخواست صریح کارفرما: «یه فضای
// بسیار شیک... به شدت حرفه‌ای» و «مثل یه ریل یا نوار افقی، آخرین ۶ تا ۱۰ استوری کاربرها».
//
// خودِ این فایل Server Component است (بدون "use client")، دقیقاً هم‌الگو با
// src/app/[lang]/HomeShowcaseBanners.tsx — داده را والد (page.tsx) از src/lib/home/homeQueries.ts
// (نسخه‌ی کش‌شده‌ی fetchLatestStoriesForHome) می‌گیرد. تنها بخش تعاملیِ این صفحه (باز کردنِ
// Viewer با کلیک) داخل UserStoryAvatar کپسوله شده — یک کامپوننت کلاینتِ کاملاً مجزا که این فایل
// فقط آن را رندر می‌کند؛ ترکیب Server Component + یک فرزند Client Component، الگوی استاندارد
// Next.js App Router.
import { UserStoryAvatar } from "@/components/stories/UserStoryAvatar";
import type { StoryViewerDict } from "@/components/stories/StoryViewer";
import type { HomeStoryPreview } from "@/lib/home/homeQueries";

export type StoriesShowcaseDict = {
  title: string;
  subtitle: string;
  ownerFallbackName: string;
};

export function StoriesShowcase({
  items,
  viewerId,
  dict,
  ringAriaLabelTemplate,
  loadErrorMessage,
  viewerDict,
}: {
  items: HomeStoryPreview[];
  viewerId: string | null;
  dict: StoriesShowcaseDict;
  // این سه مقدار عمداً از dict.stories (همان namespace مشترکی که پروفایل هم استفاده می‌کند)
  // پاس داده می‌شوند، نه یک کپی جداگانه زیر dict.home.sections.stories — تا همان متن‌های ترجمه
  // (برچسب حلقه، پیام خطای بارگذاری، متن‌های کامل Viewer) دوبار در دیکشنری تکرار نشوند.
  ringAriaLabelTemplate: string;
  loadErrorMessage: string;
  viewerDict: StoryViewerDict;
}) {
  if (items.length === 0) {
    // برخلاف بقیه‌ی بخش‌های صفحه‌ی اصلی (که حتی وقتی خالی‌اند یک کارت «هنوز چیزی ثبت نشده»
    // نشان می‌دهند)، وقتی هیچ استوری فعالی در کل پلتفرم نیست، این بخش عمداً کاملاً از صفحه حذف
    // می‌شود، نه یک کارت خالی — چون استوری یک ویژگیِ «وقتی هست خیلی جذاب است، وقتی نیست جای
    // خالی‌اش آزاردهنده نیست» است؛ کارتِ «هنوز استوری‌ای نیست» درست بالای هدر برند صفحه‌ی اصلی
    // حسِ بدی از خلوت‌بودن پلتفرم القا می‌کرد.
    return null;
  }

  return (
    <section>
      <div className="px-4 md:px-0 mb-3">
        <h2 className="font-extrabold text-lg text-text-main">{dict.title}</h2>
        <p className="text-sm text-text-muted">{dict.subtitle}</p>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((story) => {
          const displayName = story.ownerName?.trim() ? story.ownerName : dict.ownerFallbackName;
          return (
            <div key={story.storyId} className="flex flex-col items-center gap-1.5 w-[76px] shrink-0 snap-start">
              <UserStoryAvatar
                userId={story.ownerId}
                ownerName={displayName}
                hasActiveStory={true}
                isOwnStories={viewerId === story.ownerId}
                size={64}
                ariaLabel={ringAriaLabelTemplate.replace("{name}", displayName)}
                loadErrorMessage={loadErrorMessage}
                viewerDict={viewerDict}
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
              </UserStoryAvatar>
              <span className="text-[11px] font-bold text-text-main text-center truncate w-full">
                {displayName}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}