// مسیر فایل: src/app/[lang]/layout.tsx
// **به‌روزرسانی تسک ۸ فاز ۰۲**: افزودن مودال سراسری سلب مسئولیت معاملات (DisclaimerModal).
// وضعیت «دیده‌شدن» از روی کوکی yakja_disclaimer_ack، سمت سرور و در همین لایه‌ی مشترک خوانده
// می‌شود (دقیقاً هم‌الگو با نحوه‌ی خواندن dict در همین فایل) تا حتی پیش از اجرای جاوااسکریپت هم
// وضعیت درست باشد و هیچ چشمک‌زدن (Flash) نمایش نامناسب رخ ندهد.
//
// **به‌روزرسانی بصری قبلی (بند ۶.۱۵ — اصلاحات ظاهری، بدون تغییر منطق)**:
// ۱) اضافه‌شدن DesktopHeader بالای main، فقط از md به‌بالا نمایش داده می‌شود.
// ۲) عرض main در دسکتاپ از max-w-2xl (باریک، ظاهر موبایلی) به max-w-4xl افزایش یافت.
// BottomNav در موبایل دقیقاً همان‌جایی که DesktopHeader نمایش داده می‌شود مخفی می‌گردد (md:hidden
// در خودِ BottomNav.tsx)، تا هیچ فاصله‌ی بدون‌ناوبری بین دو حالت وجود نداشته باشد.
//
// **به‌روزرسانی تسک ۶ فاز ۰۸ («صیقل نهایی ظاهر اپ‌گونه»):** کلاس ثابت و تقریبیِ قبلی `pb-20`
// روی main با کلاس تازه‌ی `pb-bottom-nav` (تعریف‌شده در globals.css، همین تسک) جایگزین شد.
// دلیل: `pb-20` یک مقدار ثابت (۸۰ پیکسل) بود که فقط برای ارتفاع خودِ نوار (۶۵ پیکسل) + کمی
// فاصله کافی بود؛ اما روی گوشی‌هایی با Safe Area (مثلاً آیفون‌های بدون دکمه‌ی Home)، اکنون که
// BottomNav.tsx واقعاً فاصله‌ی ایمن پایین صفحه را می‌گیرد (رفع باگ pb-safe، همین تسک)، ارتفاع
// واقعی نوار می‌تواند از ۸۰ پیکسل بیشتر شود؛ در آن حالت، `pb-20` ثابت دیگر کافی نبود و ممکن بود
// پایین‌ترین بخش محتوای هر صفحه (مثلاً دکمه‌ی آخر یک فرم) زیر نوار پنهان بماند. `pb-bottom-nav`
// این مقدار را با `calc()` و `env(safe-area-inset-bottom)` به‌صورت پویا محاسبه می‌کند، پس روی هر
// گوشی، دقیق و کافی است. در دسکتاپ چیزی تغییر نکرد (`md:pb-6` دست‌نخورده باقی ماند).
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getDictionary } from "@/dictionaries/getDictionary";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { LangHtmlSync } from "@/components/layout/LangHtmlSync";
import { DisclaimerModal } from "@/components/layout/DisclaimerModal";
import { DISCLAIMER_COOKIE_NAME } from "@/lib/disclaimer/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang);

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    manifest: `/api/manifest?lang=${resolvedParams.lang}`,
    icons: {
      icon: [
        { url: "/icons/yakja-icon-64.png", sizes: "64x64", type: "image/png" },
        { url: "/icons/yakja-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/yakja-icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/icons/yakja-icon-1024.png", sizes: "1024x1024", type: "image/png" }],
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const resolvedParams = await params;
  // خوانش فرهنگ لغت (دیکشنری سروری) برای هدایت اطلاعات نویگیشنِ Bottom/Desktop
  const dict = await getDictionary(resolvedParams.lang);

  // تسک ۸ فاز ۰۲ — بررسی اینکه آیا کاربر پیش‌تر پیام سلب مسئولیت را دیده و تایید کرده یا نه
  const cookieStore = await cookies();
  const disclaimerAcknowledged = cookieStore.get(DISCLAIMER_COOKIE_NAME)?.value === "1";

  return (
    <ToastProvider>
      <LangHtmlSync lang={resolvedParams.lang} />
      <DisclaimerModal initiallyAcknowledged={disclaimerAcknowledged} dict={dict.disclaimer} />
      <DesktopHeader lang={resolvedParams.lang} dict={dict} />
      {/* جدا کردن فضاسازی پایینی برای BottomNav در موبایل با `pb-bottom-nav` (پویا و آگاه از
          Safe Area، تسک ۶ فاز ۰۸)؛ در دسکتاپ چون BottomNav مخفی است، فقط یک فاصله‌ی معمولی
          (`md:pb-6`) کافی است. */}
      <main className="flex-1 w-full min-h-full pb-bottom-nav md:pb-6 mx-auto max-w-lg md:max-w-3xl lg:max-w-4xl bg-white/30 md:bg-white shadow-sm md:shadow-none border-x md:border-x-0 border-slate-100">
        {children}
      </main>
      <BottomNav labels={dict.nav} />
    </ToastProvider>
  );
}