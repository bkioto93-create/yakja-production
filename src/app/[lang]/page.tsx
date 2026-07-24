// مسیر فایل: src/app/[lang]/page.tsx
// کانون سیستماتی اصلی «یکجا» داشبورد هدایت چهار وجه اپلیکیشن
// **به‌روزرسانی بصری (بند ۶.۱۵)**: کاور موبایلی حالا فقط زیر md نمایش داده می‌شود؛ برای md
// به‌بالا یک بنر دسکتاپی جداگانه با همان متون دیکشنری (بدون هیچ متن هاردکد جدید) اضافه شده،
// و گرید دسته‌ها در دسکتاپ ۴ ستونه و بزرگ‌تر است. هیچ مسیر یا منطق جدیدی اضافه نشده.
import { getDictionary } from "@/dictionaries/getDictionary";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { Footer } from "@/components/layout/Footer";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);

  // تعریف کورت مرکزی پورتال یکجا برپایهِ متغیرهای متصل‌کننده!
  const categories = [
    { id: 'listings', href: `/${lang}/listings`, title: dict.dashboard.categories.listings, icon: Icons.Box, textColor: "text-blue-500", bgColor: "bg-blue-100/60" },
    { id: 'transport', href: `/${lang}/transport`, title: dict.dashboard.categories.transport, icon: Icons.Truck, textColor: "text-accent", bgColor: "bg-accent/10" },
    { id: 'services', href: `/${lang}/services`, title: dict.dashboard.categories.services, icon: Icons.Wrench, textColor: "text-emerald-500", bgColor: "bg-emerald-100/60" },
    { id: 'real-estate', href: `/${lang}/real-estate`, title: dict.dashboard.categories.realEstate, icon: Icons.Home, textColor: "text-purple-500", bgColor: "bg-purple-100/60" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-base sm:border-x md:border-x-0 border-slate-100 max-w-md md:max-w-none mx-auto shadow-sm md:shadow-none pb-8 relative animate-fade-in w-full overflow-hidden">

      {/* کاور برند موبایلی (فقط زیر md) — طبق معماری رنگ سند راهبردی بند ۱ */}
      <div className="md:hidden bg-gradient-to-tr from-primary to-primary-dark text-white pt-[50px] pb-[35px] px-[28px] rounded-b-[40px] shadow-sm relative w-full isolate">
         <div className="absolute top-[-70px] left-[-40px] w-[200px] h-[200px] bg-white opacity-[0.06] rounded-full blur-[2px] z-0"></div>
         <h1 className="text-[34px] font-extrabold drop-shadow-[0_2px_12px_rgba(0,0,0,0.2)] mb-[2px] leading-tight flex items-center relative z-10 rtl:text-right text-right pl-4">
             {dict.contact.brandVal.split(' |')[0]}
         </h1>
         <p className="text-[14px] font-semibold opacity-95 block mt-[5px] pl-[5px] relative z-10 pr-2 pb-[10px]">
             {dict.home.slogan}
         </p>
      </div>

      {/* بنر برند دسکتاپی (فقط md به‌بالا) — همان محتوای دیکشنری، چیدمان بزرگ‌تر دوستونه */}
      <div className="hidden md:flex items-center justify-between gap-10 bg-gradient-to-l from-primary to-primary-dark text-white px-12 py-14 w-full relative isolate overflow-hidden">
        <div className="absolute -top-24 -left-16 w-[320px] h-[320px] bg-white opacity-[0.06] rounded-full blur-[2px] z-0"></div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl lg:text-4xl font-extrabold drop-shadow-[0_2px_12px_rgba(0,0,0,0.2)] mb-3 leading-tight">
            {dict.home.welcome}
          </h1>
          <p className="text-base font-semibold opacity-95 leading-relaxed">
            {dict.meta.description}
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-[160px] h-[160px] rounded-[36px] bg-white/10 backdrop-blur flex items-center justify-center">
          <Icons.Box className="w-16 h-16 stroke-[1.5px]" />
        </div>
      </div>

      <div className="flex-1 px-[24px] md:px-12 mt-8 w-full z-10 flex flex-col justify-start align-top content-start justify-items-start space-y-4">
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
                 <div className="bg-white border-[1px] border-slate-100/70 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] h-[175px] md:h-[190px] p-[16px] flex flex-col items-center justify-center text-center gap-y-4 relative w-full aspect-auto transition-shadow">
                    <div className={`w-[75px] h-[75px] md:w-[82px] md:h-[82px] shrink-0 rounded-[22px] flex items-center justify-center shadow-inner ${item.bgColor} ${item.textColor} origin-bottom mx-auto drop-shadow-sm`}>
                       <item.icon className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] stroke-[2.2px] ml-0 inline-block align-baseline shrink-0 aspect-square " />
                    </div>
                    <span className="text-[13px] md:text-sm font-bold text-slate-800 leading-[18px] max-w-full px-[5px] overflow-hidden overflow-ellipsis break-words flex flex-wrap align-middle inline">
                       {item.title}
                    </span>
                 </div>
              </Link>
            ))}
         </div>
      </div>

      <div className="my-[8px] max-h-min shrink"></div>
      
      {/* ادغام کامل متصل‌شده و تایپ‌سیف Footer مرکزی پایین فرم‌بدنه موبایلی/فول-مکس دسکتاپی با پاسکارهای کانتکسی لنگ*/}
      <Footer lang={lang} dict={dict} />
    </div>
  );
}
