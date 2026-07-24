// مسیر فایل: src/app/[lang]/contact/page.tsx
// صفحه‌ سبک PWA ارتباط و هویت بر پایه اصول RTL در افغانستان!
import { getDictionary } from "@/dictionaries/getDictionary";
import Link from "next/link";

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-col min-h-screen sm:min-h-[90vh] bg-bg-base relative">
       {/* هدبر / نوار بالا صفحه */}
       <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm min-h-[60px]">
         <Link 
           href={`/${lang}`} 
           className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 active:scale-95 text-text-muted hover:bg-slate-50 transition-all z-20"
         >
           {/* فلش برگشت متناسب با فضای RTL راست به چپ (به سمت راست خروج از منو) */}
           <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M10 19l6-7-6-7" strokeLinecap="round" strokeLinejoin="round"/>
           </svg>
         </Link>
         <h1 className="text-base font-bold text-text-main absolute left-1/2 -translate-x-1/2 w-full text-center">
            {dict.contact.title}
         </h1>
         {/* بلوک فیک جهت تعادل مرکزی منو بالا در فلکس (Balance Layout Header) */}
         <div className="w-10"></div> 
       </div>

       {/* هسته‌ی ارتباط با کاربران (بهینه شده با تکنیک Flex Mobile و رنگ‌های چشم‌نواز برند) */}
       <div className="flex-1 px-5 pt-8 flex flex-col items-center">
          <div className="w-[110px] h-[110px] rounded-[36px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 border-4 border-primary/20">
            {/* سمبل مرکزی بدون عکس برای سبکی (سرعت 2g) */}
            <span className="text-[55px] font-extrabold text-white tracking-tighter block mt-[-5px]">Y</span>
          </div>
          
          <h2 className="text-2xl font-extrabold text-primary mt-4 mb-2 pb-5 border-b-[2px] border-dashed border-slate-200/70 text-center w-[80%] block leading-tight">
            {dict.contact.brandVal}
          </h2>

          <div className="w-full flex flex-col space-y-3 mt-4 mb-6">
             {/* کادر تلفن: واکنشگرا (لینک Tel مستقیم پروتکل به اپلیکیشن تلفن اندروید می‌پرد طبق نیاز قرارداد) */}
             <div className="flex items-center gap-4 px-5 py-4 rounded-3xl bg-white shadow-sm border border-slate-100">
                <div className="w-[45px] h-[45px] shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/5">
                   <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1 truncate">
                  <p className="text-[11px] font-extrabold text-text-muted mb-0.5">{dict.contact.phoneLabel}</p>
                  <a dir="ltr" href={`tel:${dict.contact.phoneVal}`} className="text-[19px] font-bold text-text-main inline-block border-b-2 border-primary/20 pb-0.5 max-w-full truncate">{dict.contact.phoneVal}</a>
                </div>
             </div>

             {/* کادر آدرس مرکزی پلتفرم */}
             <div className="flex items-center gap-4 px-5 py-4 rounded-3xl bg-white shadow-sm border border-slate-100 min-h-[90px]">
                <div className="w-[45px] h-[45px] shrink-0 bg-accent/10 rounded-2xl flex items-center justify-center text-accent border border-accent/5 self-start mt-0.5">
                   <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div className="flex-1 leading-snug break-words hyphens-auto pr-1">
                  <p className="text-[11px] font-extrabold text-text-muted mb-1">{dict.contact.addressLabel}</p>
                  <p className="text-[14.5px] font-bold text-text-main leading-relaxed text-right line-clamp-4">{dict.contact.addressVal}</p>
                </div>
             </div>

             {/* کادر وبسایت برند یکجا (Link Blank Target Desktop PWA Ready) */}
             <div className="flex items-center gap-4 px-5 py-4 rounded-3xl bg-white shadow-sm border border-slate-100">
                <div className="w-[45px] h-[45px] shrink-0 bg-blue-500/10 rounded-2xl flex flex-col items-center justify-center text-blue-500 border border-blue-500/5">
                   <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div className="flex-1 truncate pr-1">
                  <p className="text-[11px] font-extrabold text-text-muted mb-1">{dict.contact.domainLabel}</p>
                  <a href={`https://${dict.contact.domainVal}`} dir="ltr" target="_blank" className="text-lg font-bold text-blue-600 block decoration-blue-500 active:opacity-70 transition-opacity truncate max-w-full mr-auto rtl:ml-auto w-max px-0">{dict.contact.domainVal}</a>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}