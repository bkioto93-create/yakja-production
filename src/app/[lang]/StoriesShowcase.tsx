// مسیر فایل: src/app/[lang]/StoriesShowcase.tsx
// قابلیت استوری — ردیف «تازه‌ترین استوری‌ها»ی صفحه‌ی اصلی. طبق درخواست صریح کارفرما: «یه فضای
// بسیار شیک... به شدت حرفه‌ای» و «مثل یه ریل یا نوار افقی، آخرین ۶ تا ۱۰ استوری کاربرها».
//
// **به‌روزرسانی (زنجیره‌ی استوری بین کاربرها، دقیقاً مثل اینستاگرام):** طبق درخواست صریح
// کارفرما، این ردیف — و فقط همین ردیف، نه پروفایل خودم/عمومی — باید وقتی به آخرین استوریِ یک
// کاربر می‌رسیم و «بعدی» زده می‌شود، به‌جای بسته‌شدنِ Viewer، برود سراغ اولین استوریِ کاربرِ
// بعدیِ همین ردیف؛ و برعکس، از اولین استوری یک کاربر «قبلی» زدن، برود به آخرین استوریِ کاربرِ
// قبلی. فقط وقتی واقعاً هیچ کاربرِ بعدی/قبلی‌ای در ردیف نمانده، Viewer بسته می‌شود.
//
// چون این رفتار نیازمند دانستنِ «کل فهرست کاربرهای ردیف» است (نه فقط یک کاربر، آن‌طور که
// UserStoryAvatar کپسوله می‌کند)، این فایل دیگر از UserStoryAvatar استفاده نمی‌کند — خودش
// مستقیماً StoryRing (کاملاً نمایشی) را می‌چیند و state «کدام کاربر الان باز است» را نگه
// می‌دارد. UserStoryAvatar دست‌نخورده باقی ماند و همچنان در پروفایل خودم/عمومی استفاده می‌شود
// (جایی که اصلاً مفهومِ «کاربر بعدی» وجود ندارد).
//
// چون این state‌داری، این فایل از Server Component به Client Component تبدیل شد — والد
// (page.tsx) همچنان داده را سمت سرور می‌خواند و به‌عنوان prop پاس می‌دهد؛ فقط تعامل کلیک/ناوبری
// اینجا سمت کلاینت است.
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { Icons } from "@/components/ui/Icons";
import { StoryRing } from "@/components/stories/StoryRing";
import { StoryViewer, type StoryViewerDict } from "@/components/stories/StoryViewer";
import { getUserStoriesAction } from "@/app/[lang]/profile/storyActions";
import type { ActiveStory } from "@/lib/stories/storyQueries";
import type { HomeStoryPreview } from "@/lib/home/homeQueries";

export type StoriesShowcaseDict = {
  title: string;
  subtitle: string;
  ownerFallbackName: string;
  viewAll: string;
  viewAllAriaLabel: string;
};

export function StoriesShowcase({
  items,
  viewerId,
  dict,
  lang,
  ringAriaLabelTemplate,
  loadErrorMessage,
  viewerDict,
}: {
  items: HomeStoryPreview[];
  viewerId: string | null;
  dict: StoriesShowcaseDict;
  // برای ساخت لینک «همه استوری‌ها» — مسیر همیشه زبان‌دار است (/fa/stories یا /ps/stories).
  lang: string;
  ringAriaLabelTemplate: string;
  loadErrorMessage: string;
  viewerDict: StoryViewerDict;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  // کدام کاربرِ ردیف الان در Viewer باز است (index داخل items) — null یعنی بسته.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [openStories, setOpenStories] = useState<ActiveStory[] | null>(null);
  const [openInitialIndex, setOpenInitialIndex] = useState<number | "last">(0);
  const [isOpening, setIsOpening] = useState(false);

  // کش سبک در حافظه (نه state — چون تغییرش نباید رندر مجدد بدهد) برای این‌که وقتی کاربر بین
  // چند نفرِ ردیف جلو/عقب می‌رود، اگر قبلاً همان نفر را دیده، دوباره از سرور نخواند.
  const cacheRef = useRef<Record<string, ActiveStory[]>>({});

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

  // پیش‌بارگذاری (Prefetch) نفرِ بعدی/قبلیِ ردیف در پس‌زمینه، هر بار که کاربرِ بازشده عوض
  // می‌شود — تا وقتی واقعاً «بعدی/قبلی» زده شد، معمولاً از قبل در کش باشد و جابه‌جایی بدون هیچ
  // مکثی حس شود (دقیقاً همان روانیِ استوری اینستاگرام).
  useEffect(() => {
    if (openIndex === null) return;
    const neighborIndexes = [openIndex - 1, openIndex + 1].filter(
      (i) => i >= 0 && i < items.length
    );
    for (const i of neighborIndexes) {
      const ownerId = items[i].ownerId;
      if (!cacheRef.current[ownerId]) {
        void fetchStoriesFor(ownerId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  // رفتن به کاربرِ بعدیِ ردیف — اگر استوری‌های آن کاربر (مثلاً همین الان منقضی شده) خالی بود، به
  // نفرِ بعدترش امتحان می‌کند، نه این‌که بی‌دلیل ببندد.
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
    // هیچ کاربرِ قبلی‌ای نمانده — چیزی برای انجام‌دادن نیست، همان‌جا (اولین استوریِ اولین کاربر)
    // می‌ماند.
  }

  function handleClose() {
    setOpenIndex(null);
    setOpenStories(null);
  }

  function handleDeleted() {
    router.refresh();
  }

  if (items.length === 0) {
    // برخلاف بقیه‌ی بخش‌های صفحه‌ی اصلی (که حتی وقتی خالی‌اند یک کارت «هنوز چیزی ثبت نشده»
    // نشان می‌دهند)، وقتی هیچ استوری فعالی در کل پلتفرم نیست، این بخش عمداً کاملاً از صفحه حذف
    // می‌شود، نه یک کارت خالی — چون استوری یک ویژگیِ «وقتی هست خیلی جذاب است، وقتی نیست جای
    // خالی‌اش آزاردهنده نیست» است؛ کارتِ «هنوز استوری‌ای نیست» درست بالای هدر برند صفحه‌ی اصلی
    // حسِ بدی از خلوت‌بودن پلتفرم القا می‌کرد.
    return null;
  }

  const openItem = openIndex !== null ? items[openIndex] : null;

  return (
    <section>
      <div className="px-4 md:px-0 mb-3">
        <h2 className="font-extrabold text-lg text-text-main">{dict.title}</h2>
        <p className="text-sm text-text-muted">{dict.subtitle}</p>
      </div>

      {/* **بازطراحی (درخواست کارفرما: «یک بک‌گراند نوارطور قشنگ که مشخص باشد این قسمت اسکرول
          افقی می‌خورد... یک مقدار هایلایت‌تر شود»):** خودِ ریل حالا یک نوارِ مجزا با پس‌زمینه‌ی
          گرادیانی، حاشیه‌ی نرم و گوشه‌های گرد است، پس از بقیه‌ی صفحه جدا و «هایلایت» دیده می‌شود.
          دو نشانه‌ی بصریِ اسکرول هم اضافه شد: یک محوشدگیِ گرادیانی در لبه‌ی چپ (که می‌گوید محتوا
          ادامه دارد) و دکمه‌ی «همه استوری‌ها» در انتهای ریل. */}
      <div className="relative">
        <div className="rounded-[26px] border border-slate-100 bg-gradient-to-l from-primary/[0.07] via-fuchsia-500/[0.05] to-transparent p-3 md:p-4 mx-4 md:mx-0">
          <div className="flex gap-4 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((story, index) => {
              const displayName = story.ownerName?.trim()
                ? story.ownerName
                : dict.ownerFallbackName;
              return (
                <div
                  key={story.storyId}
                  className="flex flex-col items-center gap-1.5 w-[76px] shrink-0 snap-start"
                >
                  <StoryRing
                    hasActiveStory={true}
                    onClick={() => handleOpen(index)}
                    size={64}
                    ariaLabel={ringAriaLabelTemplate.replace("{name}", displayName)}
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
                  <span className="text-[11px] font-bold text-text-main text-center truncate w-full">
                    {displayName}
                  </span>
                </div>
              );
            })}

            {/* دکمه‌ی «همه استوری‌ها» — دقیقاً در انتهای ریل (درخواست صریح کارفرما)، با همان
                اندازه‌ی حلقه‌ها تا ردیف کاملاً هم‌تراز بماند. */}
            <Link
              href={`/${lang}/stories`}
              aria-label={dict.viewAllAriaLabel}
              className="group flex flex-col items-center gap-1.5 w-[76px] shrink-0 snap-start outline-none"
            >
              <span className="w-16 h-16 rounded-full border-2 border-dashed border-primary/40 bg-white flex items-center justify-center text-primary group-active:scale-95 md:group-hover:border-primary md:group-hover:bg-primary/5 transition-all">
                {/* فلشِ «جلو» در چیدمان RTL — هم‌رویه با بقیه‌ی اپ (ArrowRight + rotate-180) */}
                <Icons.ArrowRight className="w-6 h-6 rotate-180 md:group-hover:-translate-x-0.5 transition-transform" />
              </span>
              <span className="text-[11px] font-extrabold text-primary text-center leading-tight w-full">
                {dict.viewAll}
              </span>
            </Link>
          </div>
        </div>

        {/* محوشدگیِ لبه‌ی چپ — نشانه‌ی بصریِ «هنوز محتوا هست، اسکرول کن». pointer-events-none تا
            جلوی لمس/کلیکِ حلقه‌های زیرش را نگیرد. */}
        <div className="pointer-events-none absolute inset-y-3 left-4 md:left-0 w-12 rounded-l-[26px] bg-gradient-to-l from-transparent to-white/80" />
      </div>

      {/* یک اسپینر کوچک تمام‌صفحه فقط برای لحظه‌ی اول بازکردن (پیش از آماده‌شدنِ اولین Viewer) —
          برای جابه‌جایی بین کاربرها (بعدی/قبلی) چون معمولاً از کش پیش‌بارگذاری‌شده می‌آید، دیگر
          نیازی به این لودینگ نیست و Viewer قبلی بدون پرش تا لحظه‌ی آماده‌شدنِ نفر بعدی باز می‌ماند. */}
      {isOpening && openIndex === null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {openItem && openStories && (
        <StoryViewer
          key={openItem.ownerId}
          stories={openStories}
          ownerName={openItem.ownerName?.trim() ? openItem.ownerName : dict.ownerFallbackName}
          isOwnStories={viewerId === openItem.ownerId}
          onClose={handleClose}
          onDeleted={handleDeleted}
          dict={viewerDict}
          initialIndex={openInitialIndex}
          hasNextUser={openIndex !== null && openIndex < items.length - 1}
          hasPreviousUser={openIndex !== null && openIndex > 0}
          onRequestNextUser={handleRequestNext}
          onRequestPreviousUser={handleRequestPrevious}
        />
      )}
    </section>
  );
}