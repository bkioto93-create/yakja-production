// مسیر فایل: src/components/layout/Footer.tsx
// بازطراحی کامل فوتر (درخواست صریح کارفرما: «فوتر خوشگل برای اینکه شماره تماس و اطلاعات
// پشتیبانی توش باشه» + «وقتی اپلیکیشن موبایل رو ساختیم آیکون یکجا رو بزاریم با آیکون اندروید
// کنارش که بزنن روش و برن به لینک مستقیمی که بعدا قرار میدیم»).
//
// نکته‌ی مهم درباره‌ی دکمه‌ی دانلود اپلیکیشن: مقدار لینک واقعی از
// src/lib/config/appLinks.ts (ثابت ANDROID_APP_DOWNLOAD_URL) خوانده می‌شود. تا وقتی آن مقدار
// خالی است، این بخش خودکار به‌صورت «به‌زودی» (غیرقابل‌کلیک) نمایش داده می‌شود؛ به‌محض این‌که آن
// یک مقدار در appLinks.ts گذاشته شود، همین دکمه خودکار فعال و لینک‌دار می‌شود — هیچ تغییر دیگری
// در این فایل لازم نیست.
import Link from "next/link";
import type { getDictionary } from "@/dictionaries/getDictionary";
import { Icons } from "@/components/ui/Icons";
import { ANDROID_APP_DOWNLOAD_URL } from "@/lib/config/appLinks";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export function Footer({ lang, dict }: { lang: string; dict: Dictionary }) {
  const hasAppLink = ANDROID_APP_DOWNLOAD_URL.trim().length > 0;

  const quickLinks = [
    { href: `/${lang}/listings`, label: dict.dashboard.categories.listings },
    { href: `/${lang}/transport`, label: dict.dashboard.categories.transport },
    { href: `/${lang}/services`, label: dict.dashboard.categories.services },
    { href: `/${lang}/real-estate`, label: dict.dashboard.categories.realEstate },
  ];

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-0 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* درباره‌ی یکجا */}
        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/yakja-icon-64.png" alt="یکجا" className="w-9 h-9 rounded-xl" />
            <span className="font-extrabold text-text-main text-lg">{dict.contact.brandVal}</span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed max-w-sm">
            {dict.footer.aboutUsText}
          </p>
        </div>

        {/* دسترسی سریع */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-text-main text-sm">{dict.footer.quickLinksTitle}</h3>
          <ul className="flex flex-col gap-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-text-muted hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* پشتیبانی */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-text-main text-sm">{dict.footer.supportTitle}</h3>
          <a
            href={`tel:${dict.contact.phoneVal.replace(/\s/g, "")}`}
            dir="ltr"
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <Icons.Phone className="w-4 h-4" />
            {dict.contact.phoneVal}
          </a>
          <Link
            href={`/${lang}/contact`}
            className="text-sm text-text-muted hover:text-primary"
          >
            {dict.footer.contact}
          </Link>
        </div>
      </div>

      {/* دانلود اپلیکیشن موبایل */}
      <div className="border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 md:px-0 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/yakja-icon-64.png" alt="یکجا" className="w-10 h-10 rounded-xl shrink-0" />
            <div>
              <p className="font-bold text-sm text-text-main">{dict.home.appDownload.title}</p>
              <p className="text-xs text-text-muted max-w-xs">{dict.home.appDownload.subtitle}</p>
            </div>
          </div>

          {hasAppLink ? (
            <a
              href={ANDROID_APP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-text-main text-white px-4 min-h-[48px] font-bold text-sm shrink-0"
            >
              <Icons.Android className="w-5 h-5" />
              {dict.home.appDownload.androidButton}
            </a>
          ) : (
            <span className="flex items-center gap-2 rounded-xl bg-slate-100 text-slate-400 px-4 min-h-[48px] font-bold text-sm shrink-0 cursor-not-allowed">
              <Icons.Android className="w-5 h-5" />
              {dict.footer.androidComingSoon}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 py-5 text-center flex flex-col items-center gap-1">
        <span className="text-xs font-semibold text-text-muted">{dict.footer.madeInAfghanistan}</span>
        <span className="opacity-70 text-xs font-semibold">{dict.footer.copyright}</span>
      </div>
    </footer>
  );
}
