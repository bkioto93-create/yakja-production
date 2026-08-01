// مسیر فایل: src/app/[lang]/page.tsx
// کانون سیستماتی اصلی «یکجا» — بازطراحی کامل صفحه‌ی اصلی طبق درخواست مستقیم کارفرما:
// «بنر اسپلیت با آیکون/تایتل/زیرتایتل، بنرهای پیش‌رونده‌ی افقی رانندگان/متخصصین/آگهی‌های تازه،
// بخش ویژگی‌های یکجا، بخش پرسش‌های پرتکرار، فوتر خوشگل». هیچ مسیر یا دسترسی قدیمی حذف نشد؛
// فقط محتوای بصری اضافه/تقویت شد.
//
// **کش (بند صریح کارفرما درباره‌ی اینترنت ضعیف):** چهار کوئری «جدیدترین‌ها» همه از
// src/lib/home/homeQueries.ts می‌آیند که هرکدام با unstable_cache به‌مدت ۳ دقیقه کش شده‌اند —
// یعنی حتی اگر ۱۰۰۰ کاربر هم‌زمان صفحه‌ی اصلی را باز کنند، Supabase فقط هر ۳ دقیقه یک‌بار واقعاً
// فراخوانی می‌شود، نه به‌ازای هر بازدید.
//
// **رفع باگ دیپلوی (۲۰۲۶-۰۷-۲۶):** قبلاً "icon: Icons.Box" (خودِ تابع کامپوننت) داخل آرایه‌ی
// categories گذاشته می‌شد و مستقیم به QuickAccessIcon (که "use client" است) پاس داده می‌شد.
// Next.js اجازه نمی‌دهد یک تابع از Server Component به Client Component به‌عنوان prop برود
// (قابل سریالایز نیست) — همین باعث خطای بیلد/رانتایم "Functions cannot be passed directly to
// Client Components" می‌شد. راه‌حل: فقط اسم آیکون (رشته‌ی ساده) پاس داده می‌شود، و خودِ
// QuickAccessIcon.tsx (که سمت کلاینت است) آن اسم را به کامپوننت واقعی تبدیل می‌کند.
//
// **فاز ۱۱ (عضویت VIP):** طبق بند ۷ پرامپت VIP، یک بنر تبلیغاتی VIP بین بخش «دسترسی سریع» و
// بخش «بنرهای پیش‌رونده‌ی افقی» اضافه شد (src/components/home/VipHomeBanner.tsx) — بلافاصله
// بعد از دسترسی سریع، برای بیشترین دیده‌شدن، و همچنان کاملاً «بین دسترسی سریع و چرا یکجا؟»
// طبق متن دقیق پرامپت.
import { getDictionary } from "@/dictionaries/getDictionary";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { HomeFeatures } from "./HomeFeatures";
import { HomeFaq } from "./HomeFaq";
import { HeroIllustration } from "./HeroIllustration";
import { QuickAccessIcon } from "./QuickAccessIcon";
import { VipHomeBanner } from "@/components/home/VipHomeBanner";
import {
  DriversShowcase,
  ProvidersShowcase,
  ListingsShowcase,
  RealEstateShowcase,
} from "./HomeShowcaseBanners";
import {
  getNewestDriversForHome,
  getNewestProvidersForHome,
  getNewestListingsForHome,
  getNewestRealEstateForHome,
} from "@/lib/home/homeQueries";
import { getSelectedProvince } from "@/lib/province/getSelectedProvince";

const SHOWCASE_ITEM_LIMIT = 10;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);

  // فاز ۱۰ — درخواست مستقیم کارفرما: بنرهای «جدیدترین‌ها»ی صفحه‌ی اصلی هم باید طبق ولایت
  // انتخابی کاربر فیلتر شوند، نه سراسری کل افغانستان (دقیقاً مثل صفحه‌ی اصلی دیوار).
  const { province } = await getSelectedProvince();

  // چهار کوئری «جدیدترین‌ها» موازی اجرا می‌شوند تا زمان لود کلی صفحه به کندترین کوئری محدود
  // بماند، نه مجموع هر چهار کوئری.
  const [newestDrivers, newestProviders, newestListings, newestRealEstate] = await Promise.all([
    getNewestDriversForHome(SHOWCASE_ITEM_LIMIT, province),
    getNewestProvidersForHome(SHOWCASE_ITEM_LIMIT, province),
    getNewestListingsForHome(SHOWCASE_ITEM_LIMIT, province),
    getNewestRealEstateForHome(SHOWCASE_ITEM_LIMIT, province),
  ]);

  // تعریف کورت مرکزی پورتال یکجا برپایهِ متغیرهای متصل‌کننده!
  // imageSrc: مسیر تصویر کاوایی/کیوت سه‌بعدی (بعداً توسط کارفرما اضافه می‌شود — رجوع کنید به
  // فایل راهنما برای پرامپت‌ها و مسیر دقیق). تا وقتی فایل موجود نیست، QuickAccessIcon خودکار به
  // آیکون کلاسیک (iconName) برمی‌گردد.
  const categories = [
    { id: 'listings', href: `/${lang}/listings`, title: dict.dashboard.categories.listings, iconName: "Box" as const, imageSrc: "/icons/quick-listings.png", textColor: "text-blue-500", bgColor: "bg-blue-100/60" },
    { id: 'transport', href: `/${lang}/transport`, title: dict.dashboard.categories.transport, iconName: "Truck" as const, imageSrc: "/icons/quick-transport.png", textColor: "text-accent", bgColor: "bg-accent/10" },
    { id: 'services', href: `/${lang}/services`, title: dict.dashboard.categories.services, iconName: "Wrench" as const, imageSrc: "/icons/quick-services.png", textColor: "text-emerald-500", bgColor: "bg-emerald-100/60" },
    { id: 'real-estate', href: `/${lang}/real-estate`, title: dict.dashboard.categories.realEstate, iconName: "Home" as const, imageSrc: "/icons/quick-realestate.png", textColor: "text-purple-500", bgColor: "bg-purple-100/60" },
  ];

  const trustBadges = [
    dict.home.trustBadges.fourServices,
    dict.home.trustBadges.noMiddleman,
    dict.home.trustBadges.bilingual,
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-base sm:border-x md:border-x-0 border-slate-100 max-w-md md:max-w-none mx-auto shadow-sm md:shadow-none pb-8 relative animate-fade-in w-full overflow-hidden">

      {/* کاور برند موبایلی (فقط زیر md) — طبق معماری رنگ سند راهبردی بند ۱ */}
      <div className="md:hidden bg-gradient-to-tr from-primary to-primary-dark text-white pt-[42px] pb-[30px] px-[28px] rounded-b-[40px] shadow-sm relative w-full isolate">
         <div className="absolute top-[-70px] left-[-40px] w-[200px] h-[200px] bg-white opacity-[0.06] rounded-full blur-[2px] z-0"></div>
         <div className="absolute -bottom-10 -right-10 w-[160px] h-[160px] bg-white opacity-[0.05] rounded-full blur-[2px] z-0"></div>

         {/* رفع باگ (۲۰۲۶-۰۷-۲۶): آیکون قبلاً کوچک بود و کنار متن در یک گوشه جا می‌گرفت. الان
             آیکون کاملاً وسط‌چین است، بلوک مستقل و بزرگ‌تر خودش را می‌گیرد و همه‌ی متن‌ها زیرش
             قرار می‌گیرند. */}
         <div className="relative z-10 flex flex-col items-center text-center gap-3">
           <div className="w-[150px] h-[150px] rounded-[36px] bg-white/10 backdrop-blur flex items-center justify-center p-6">
             <HeroIllustration className="w-full h-full" />
           </div>

           <span className="inline-block text-[11px] font-bold bg-white/15 rounded-full px-3 py-1">
              {dict.home.heroBadge}
           </span>

           <h1 className="text-[28px] font-extrabold drop-shadow-[0_2px_12px_rgba(0,0,0,0.2)] leading-tight">
               {dict.home.welcome}
           </h1>
           <p className="text-[14px] font-semibold opacity-95 leading-relaxed">
               {dict.home.slogan}
           </p>

           <div className="flex flex-wrap justify-center gap-2 mt-1">
             {trustBadges.map((badge) => (
               <span key={badge} className="text-[11px] font-bold bg-white/10 rounded-full px-2.5 py-1">
                 {badge}
               </span>
             ))}
           </div>
         </div>
      </div>

      {/* بنر برند دسکتاپی (فقط md به‌بالا) — همان محتوای دیکشنری، چیدمان بزرگ‌تر دوستونه */}
      <div className="hidden md:flex items-center justify-between gap-10 bg-gradient-to-l from-primary to-primary-dark text-white px-12 py-14 w-full relative isolate overflow-hidden">
        <div className="absolute -top-24 -left-16 w-[320px] h-[320px] bg-white opacity-[0.06] rounded-full blur-[2px] z-0"></div>
        <div className="absolute -bottom-16 -right-10 w-[220px] h-[220px] bg-white opacity-[0.05] rounded-full blur-[2px] z-0"></div>
        <div className="relative z-10 max-w-xl">
          <span className="inline-block text-xs font-bold bg-white/15 rounded-full px-3 py-1 mb-4">
            {dict.home.heroBadge}
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold drop-shadow-[0_2px_12px_rgba(0,0,0,0.2)] mb-3 leading-tight">
            {dict.home.welcome}
          </h1>
          <p className="text-base font-semibold opacity-95 leading-relaxed">
            {dict.home.slogan}
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {trustBadges.map((badge) => (
              <span key={badge} className="text-xs font-bold bg-white/10 rounded-full px-3 py-1.5">
                {badge}
              </span>
            ))}
          </div>
        </div>
        {/* رفع باگ (۲۰۲۶-۰۷-۲۶): آیکون خیلی کوچک بود؛ از ۱۶۰px به ۲۴۰px بزرگ‌تر شد */}
        <div className="relative z-10 shrink-0 w-[240px] h-[240px] rounded-[44px] bg-white/10 backdrop-blur flex items-center justify-center p-6">
          <HeroIllustration className="w-full h-full" />
        </div>
      </div>

      <div className="flex-1 px-[24px] md:px-12 mt-8 w-full z-10 flex flex-col justify-start align-top content-start justify-items-start space-y-12">

         {/* دسترسی سریع به چهار ماژول */}
         <div className="space-y-4">
           <h2 className="text-[17px] md:text-lg font-bold text-text-main inline-block border-r-4 border-accent pr-[10px] mt-2 mb-[12px] opacity-90 block">
              {dict.dashboard.quickAccess}
           </h2>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] md:gap-6">
              {categories.map((item) => (
                <Link
                  href={item.href}
                  key={item.id}
                  className="block outline-none select-none active:scale-95 md:hover:-translate-y-1 transition-transform origin-center ease-out w-full max-w-[200px] md:max-w-none"
                >
                   <div className="bg-white border-[1px] border-slate-100/70 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] h-[250px] md:h-[270px] p-[16px] flex flex-col items-center justify-center text-center gap-y-4 relative w-full aspect-auto transition-shadow">
                      {/* رفع باگ (۲۰۲۶-۰۷-۲۶): اندازه‌ی آیکون (باکس + پدینگ) دقیقاً ۲ برابر شد */}
                      <div className={`w-[150px] h-[150px] md:w-[164px] md:h-[164px] shrink-0 rounded-[44px] flex items-center justify-center shadow-inner overflow-hidden ${item.bgColor} ${item.textColor} origin-bottom mx-auto drop-shadow-sm p-6`}>
                         <QuickAccessIcon
                           src={item.imageSrc}
                           fallbackIconName={item.iconName}
                           fallbackClassName="w-[72px] h-[72px] md:w-[80px] md:h-[80px] stroke-[2.2px] shrink-0"
                         />
                      </div>
                      <span className="text-[13px] md:text-sm font-bold text-slate-800 leading-[18px] max-w-full px-[5px] overflow-hidden overflow-ellipsis break-words flex flex-wrap align-middle inline">
                         {item.title}
                      </span>
                   </div>
                </Link>
              ))}
           </div>
         </div>

         {/* بنر VIP — فاز ۱۱، بند ۷ پرامپت VIP: بین «دسترسی سریع» و «چرا یکجا؟» */}
         <VipHomeBanner lang={lang} dict={dict.vip.homeBanner} />

         {/* بنرهای پیش‌رونده‌ی افقی — رانندگان/متخصصین/کالا/ملک تازه (درخواست صریح کارفرما) */}
         <div className="-mx-[24px] md:mx-0 space-y-8">
           <DriversShowcase
             items={newestDrivers}
             dict={dict.home.sections.drivers}
             memberFallbackLabel={dict.home.memberFallbackLabel}
             vehicleTypeLabels={dict.transport.vehicleTypes}
             lang={lang}
           />
           <ProvidersShowcase
             items={newestProviders}
             dict={dict.home.sections.providers}
             memberFallbackLabel={dict.home.memberFallbackLabel}
             lang={lang}
           />
           <ListingsShowcase
             items={newestListings}
             dict={dict.home.sections.listings}
             currencyLabel={dict.marketplace.detail.currencyLabel}
             categoryLabels={dict.marketplace.categories}
             lang={lang}
           />
           <RealEstateShowcase
             items={newestRealEstate}
             dict={dict.home.sections.realEstate}
             currencyLabel={dict.realEstate.detail.currencyLabel}
             propertyTypeLabels={dict.realEstate.propertyTypes}
             dealTypeLabels={dict.realEstate.dealTypes}
             lang={lang}
           />
         </div>

         {/* چرا یکجا؟ */}
         <div className="-mx-[24px] md:mx-0">
           <HomeFeatures dict={dict.home.features} />
         </div>

         {/* پرسش‌های پرتکرار */}
         <div className="-mx-[24px] md:mx-0">
           <HomeFaq dict={dict.home.faq} />
         </div>
      </div>

      <div className="my-[8px] max-h-min shrink"></div>

      {/* ادغام کامل متصل‌شده و تایپ‌سیف Footer مرکزی پایین فرم‌بدنه موبایلی/فول-مکس دسکتاپی با پاسکارهای کانتکسی لنگ*/}
      <Footer lang={lang} dict={dict} />
    </div>
  );
}