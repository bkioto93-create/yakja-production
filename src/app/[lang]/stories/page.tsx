// مسیر فایل: src/app/[lang]/stories/page.tsx
// صفحه‌ی «همه استوری‌ها» — درخواست صریح کارفرما: «یک صفحه‌ی جدید که تمام استوری‌های کاربران
// نمایش داده شود... خیلی حرفه‌ای و شکیل... و نباید همه با هم لود بشن چون اینترنت در افغانستان
// ضعیف هست، باید چند تا چند تا لود بشه.»
//
// معماری (دقیقاً هم‌الگو با بقیه‌ی صفحات فهرستیِ این پروژه، مثل services/page.tsx):
//   • این فایل یک Server Component است: فقط **دسته‌ی اول** را سمت سرور می‌خواند و به کامپوننت
//     کلاینت پاس می‌دهد. یعنی کاربر بلافاصله محتوا می‌بیند — حتی پیش از این‌که جاوااسکریپت صفحه
//     اجرا شود؛ روی اینترنت ۲G/۳G این تفاوت خیلی محسوس است.
//   • بارگذاری دسته‌های بعدی کاملاً در AllStoriesClient.tsx انجام می‌شود (اسکرول خودکار +
//     دکمه‌ی پشتیبان). رجوع کنید به یادداشت بالای همان فایل.
//
// چرا این صفحه کش نمی‌شود (برخلاف ردیف استوریِ صفحه‌ی اصلی که ۳ دقیقه کش دارد): آن ردیف روی
// پربازدیدترین صفحه‌ی اپ است و کش‌کردنش فشار واقعی از Supabase برمی‌دارد. این صفحه اما مقصدی
// است که کاربر عمداً و کمتر به آن می‌رود، و انتظار دارد «همه»ی استوری‌های همین لحظه را ببیند —
// پس تازگیِ داده اینجا مهم‌تر از صرفه‌جویی است.
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchStoriesPage } from "@/lib/stories/storyQueries";
import { Icons } from "@/components/ui/Icons";
import { AllStoriesClient } from "./AllStoriesClient";
import { STORIES_PAGE_SIZE } from "./constants";

// عنوان/توضیح اختصاصی این صفحه برای تب مرورگر و اشتراک‌گذاری — هم‌الگو با generateMetadata
// لایوت زبان (src/app/[lang]/layout.tsx)، فقط با متن‌های مخصوص همین صفحه.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.stories.page.metaTitle,
    description: dict.stories.page.metaDescription,
  };
}

export default async function AllStoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const pageDict = dict.stories.page;

  // دسته‌ی اول + هویت بیننده، موازی — تا زمان لود صفحه به کندترین کوئری محدود بماند، نه مجموع.
  // getCurrentUser لازم است چون Viewer باید بداند «آیا این بیننده صاحب همین استوری است؟» تا
  // دکمه‌ی حذف را فقط به صاحب واقعی نشان بدهد.
  const [firstPage, viewer] = await Promise.all([
    fetchStoriesPage(STORIES_PAGE_SIZE, null),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6 px-5 md:px-0 pt-6 pb-12 max-w-lg md:max-w-3xl mx-auto w-full">
      {/* سربرگ — با دکمه‌ی بازگشت، چون این صفحه یک مقصد است نه یکی از تب‌های نوار پایین */}
      <div className="flex items-start gap-3">
        <Link
          href={`/${lang}`}
          aria-label={pageDict.backToHome}
          className="shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 md:hover:bg-slate-200 transition-all mt-0.5"
        >
          <Icons.ArrowRight className="w-5 h-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-text-main leading-tight">
            {pageDict.title}
          </h1>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">{pageDict.subtitle}</p>
        </div>
      </div>

      {/* نوارِ تزئینیِ هم‌خانواده با ریلِ استوریِ صفحه‌ی اصلی — همان زبان بصری، تا کاربر حس کند
          واقعاً «ادامه‌ی» همان بخش است، نه یک صفحه‌ی بی‌ربط. */}
      <div className="h-1 w-full rounded-full bg-gradient-to-l from-primary/40 via-fuchsia-500/30 to-transparent" />

      <AllStoriesClient
        initialItems={firstPage.items}
        initialCursor={firstPage.nextCursor}
        viewerId={viewer?.id ?? null}
        dict={pageDict}
        ownerFallbackName={dict.home.sections.stories.ownerFallbackName}
        ringAriaLabelTemplate={dict.stories.ringAriaLabelTemplate}
        loadErrorMessage={dict.stories.loadErrorMessage}
        viewerDict={dict.stories.viewer}
      />
    </div>
  );
}