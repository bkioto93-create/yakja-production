// مسیر فایل: src/app/[lang]/page.tsx
// کانون سیستماتی اصلی «یکجا» — بازطراحی کامل صفحه‌ی اصلی طبق درخواست مستقیم کارفرما:
// «طراحی فوق‌حرفه‌ای، شرکتی و پریمیوم (Enterprise Dark Mode) برای بنر اصلی هیرو».
//
// **کش (بند صریح کارفرما درباره‌ی اینترنت ضعیف):** چهار کوئری «جدیدترین‌ها» همه از
// src/lib/home/homeQueries.ts می‌آیند که هرکدام با unstable_cache به‌مدت ۳ دقیقه کش شده‌اند —
// یعنی حتی اگر ۱۰۰۰ کاربر هم‌زمان صفحه‌ی اصلی را باز کنند، Supabase فقط هر ۳ دقیقه یک‌بار واقعاً
// فراخوانی می‌شود، نه به‌ازای هر بازدید.
import { getDictionary } from "@/dictionaries/getDictionary";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { HomeFeatures } from "./HomeFeatures";
import { HomeFaq } from "./HomeFaq";
import { HeroIllustration } from "./HeroIllustration";
import { QuickAccessIcon } from "./QuickAccessIcon";
import { VipHomeBanner } from "@/components/home/VipHomeBanner";
import { StoriesShowcase } from "./StoriesShowcase";
import { CategoryBanner } from "@/components/home/CategoryBanner";
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
  getLatestStoriesForHome,
} from "@/lib/home/homeQueries";
import { getSelectedProvince } from "@/lib/province/getSelectedProvince";
import { getCurrentUser } from "@/lib/auth/session";

const SHOWCASE_ITEM_LIMIT = 10;
const STORIES_SHOWCASE_LIMIT = 10;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);

  const { province } = await getSelectedProvince();

  const [newestDrivers, newestProviders, newestListings, newestRealEstate, latestStories, viewer] =
    await Promise.all([
      getNewestDriversForHome(SHOWCASE_ITEM_LIMIT, province),
      getNewestProvidersForHome(SHOWCASE_ITEM_LIMIT, province),
      getNewestListingsForHome(SHOWCASE_ITEM_LIMIT, province),
      getNewestRealEstateForHome(SHOWCASE_ITEM_LIMIT, province),
      getLatestStoriesForHome(STORIES_SHOWCASE_LIMIT),
      getCurrentUser(),
    ]);

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

      {/* کاور برند موبایلی (فقط زیر md) — طراحی Premium Enterprise */}
      <div className="md:hidden bg-[#0B1121] text-white pt-16 pb-14 px-6 rounded-b-[48px] shadow-2xl relative w-full isolate overflow-hidden border-b border-slate-800">
         {/* نورپردازی شیشه‌ای پس‌زمینه (Mesh Gradient) */}
         <div className="absolute top-[-50px] -right-10 w-[250px] h-[250px] bg-primary/30 rounded-full blur-[80px] z-0 opacity-70"></div>
         <div className="absolute -bottom-20 -left-10 w-[200px] h-[200px] bg-blue-600/20 rounded-full blur-[80px] z-0 opacity-60"></div>

         <div className="relative z-10 flex flex-col items-center text-center gap-6">
           {/* نشان (Badge) */}
           <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold text-slate-200 tracking-wide">
                {dict.home.heroBadge}
              </span>
           </div>

           {/* عکس با افکت شناور در بالا برای تمرکز بصری اپل‌طور */}
           <div className="w-[200px] h-[200px] relative mt-1 mb-2">
             <HeroIllustration className="w-full h-full" />
           </div>

           {/* متون و تایپوگرافی جسورانه */}
           <div className="flex flex-col gap-3">
             <h1 className="text-[34px] font-black drop-shadow-md leading-[1.2] tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300">
                 {dict.home.welcome}
             </h1>
             <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[290px] mx-auto">
                 {dict.home.slogan}
             </p>
           </div>

           {/* نشان‌های اعتماد به‌صورت قرص‌های شیشه‌ای */}
           <div className="flex flex-wrap justify-center gap-2.5 mt-3">
             {trustBadges.map((badge) => (
               <span key={badge} className="text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                 {badge}
               </span>
             ))}
           </div>
         </div>
      </div>

      {/* بنر برند دسکتاپی (فقط md به‌بالا) — طراحی Premium Enterprise */}
      <div className="hidden md:flex items-center justify-between gap-12 bg-[#0B1121] text-white px-16 lg:px-24 py-20 w-full relative isolate overflow-hidden border-b border-slate-800">
        {/* نورپردازی شیشه‌ای پس‌زمینه (Mesh Gradient) */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[130px] z-0 opacity-60 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px] z-0 opacity-50 translate-y-1/3"></div>

        <div className="relative z-10 max-w-xl flex flex-col items-start text-right">
          {/* نشان (Badge) */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              {dict.home.heroBadge}
            </span>
          </div>

          <h1 className="text-4xl lg:text-[46px] font-black drop-shadow-lg leading-[1.25] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-300 mb-5">
            {dict.home.welcome}
          </h1>

          <p className="text-base font-medium text-slate-400 leading-relaxed max-w-lg mb-8">
            {dict.home.slogan}
          </p>

          <div className="flex flex-wrap gap-3">
            {trustBadges.map((badge) => (
              <span key={badge} className="text-xs font-bold text-slate-300 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* عکس (Mockup Area) */}
        <div className="relative z-10 shrink-0 w-[360px] h-[360px] lg:w-[420px] lg:h-[420px]">
          <HeroIllustration className="w-full h-full" />
        </div>
      </div>

      <div className="flex-1 px-[24px] md:px-12 mt-8 w-full z-10 flex flex-col justify-start align-top content-start justify-items-start space-y-12">
         {/* قابلیت استوری */}
         <StoriesShowcase
           items={latestStories}
           viewerId={viewer?.id ?? null}
           dict={dict.home.sections.stories}
           ringAriaLabelTemplate={dict.stories.ringAriaLabelTemplate}
           loadErrorMessage={dict.stories.loadErrorMessage}
           viewerDict={dict.stories.viewer}
         />

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
                  className="block outline-none select-none active:scale-95 md:hover:-translate-y-1 transition-transform origin-center ease-out w-full max-w-[200px] mx-auto md:max-w-none md:mx-0"
                >
                   <div className="bg-white border-[1px] border-slate-100/70 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] h-[250px] md:h-[270px] p-[16px] flex flex-col items-center justify-center text-center gap-y-4 relative w-full aspect-auto transition-shadow">
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

         <VipHomeBanner lang={lang} dict={dict.vip.homeBanner} />

         <div className="-mx-[24px] md:mx-0 space-y-8">
           <div className="px-[24px] md:px-0">
             <CategoryBanner
               variant="transport"
               href={`/${lang}/transport`}
               title={dict.dashboard.categories.transport}
               description={dict.home.banners.transport}
               imageSrc="/banners/transport-banner.webp"
             />
           </div>
           <DriversShowcase
             items={newestDrivers}
             dict={dict.home.sections.drivers}
             memberFallbackLabel={dict.home.memberFallbackLabel}
             vehicleTypeLabels={dict.transport.vehicleTypes}
             lang={lang}
           />

           <div className="px-[24px] md:px-0">
             <CategoryBanner
               variant="services"
               href={`/${lang}/services`}
               title={dict.dashboard.categories.services}
               description={dict.home.banners.services}
               imageSrc="/banners/services-banner.webp"
             />
           </div>
           <ProvidersShowcase
             items={newestProviders}
             dict={dict.home.sections.providers}
             memberFallbackLabel={dict.home.memberFallbackLabel}
             lang={lang}
           />

           <div className="px-[24px] md:px-0">
             <CategoryBanner
               variant="listings"
               href={`/${lang}/listings`}
               title={dict.dashboard.categories.listings}
               description={dict.home.banners.listings}
               imageSrc="/banners/marketplace-banner.webp"
             />
           </div>
           <ListingsShowcase
             items={newestListings}
             dict={dict.home.sections.listings}
             currencyLabel={dict.marketplace.detail.currencyLabel}
             categoryLabels={dict.marketplace.categories}
             lang={lang}
           />

           <div className="px-[24px] md:px-0">
             <CategoryBanner
               variant="realEstate"
               href={`/${lang}/real-estate`}
               title={dict.dashboard.categories.realEstate}
               description={dict.home.banners.realEstate}
               imageSrc="/banners/real-estate-banner.webp"
             />
           </div>
           <RealEstateShowcase
             items={newestRealEstate}
             dict={dict.home.sections.realEstate}
             currencyLabel={dict.realEstate.detail.currencyLabel}
             propertyTypeLabels={dict.realEstate.propertyTypes}
             dealTypeLabels={dict.realEstate.dealTypes}
             lang={lang}
           />
         </div>

         <div className="-mx-[24px] md:mx-0">
           <HomeFeatures dict={dict.home.features} />
         </div>

         <div className="-mx-[24px] md:mx-0">
           <HomeFaq dict={dict.home.faq} />
         </div>
      </div>

      <div className="my-[8px] max-h-min shrink"></div>

      <Footer lang={lang} dict={dict} />
    </div>
  );
}