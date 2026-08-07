// مسیر فایل: src/components/layout/Footer.tsx
//
// 🛠️ بازطراحیِ کامل (تعمیقِ رنگِ بنر در سراسر اپ — دستور صریحِ کارفرما): فوتر از پس‌زمینه‌ی
// سفید به Colors.heroDark (#0B1121، همان بنرِ اصلی) تغییر کرد — آخرین قطعه‌ی «قابِ تیره»ی
// سراسریِ اپ (بعد از هدر/نوارِ تب‌ها). نوارِ میانیِ «دانلود اپلیکیشن» عمداً یک پله روشن‌تر
// (bg-hero-dark-elevated) شد تا از بقیه‌ی فوتر بصری جدا دیده شود، بدون خروج از پالتِ تیره.
// دکمه‌ی دانلود اندروید از bg-text-main (تقریباً مشکی، روی زمینه‌ی روشنِ قبلی کنتراست خوبی
// داشت) به bg-primary تغییر کرد — چون مشکی روی زمینه‌ی تیره‌ی تازه عملاً محو می‌شد؛ فیروزه‌ای
// هم برند را حفظ می‌کند هم روی تیره کاملاً برجسته است.
// **بازطراحی کامل چیدمان (درخواست کارفرما: «فوتر بهم‌ریخته است، نظم ندارد... شماره‌ی موبایل
// بهم‌ریخته... یک بک‌گراند اختصاصی به شماره بده... در حالت دسکتاپ و تمام‌عرض و کوچک و موبایل»).**
//
// مشکلات نسخه‌ی قبلی و رفعِ هرکدام:
//
//   ۱) **گریدِ نامتوازن:** ستون «درباره» با `sm:col-span-2` دو خانه از چهار خانه را می‌گرفت و دو
//      ستون دیگر در انتها فشرده می‌شدند؛ در عرض کامل مانیتور یک فضای خالیِ بزرگ وسط می‌افتاد.
//      حالا گرید ۱۲ستونی است با نسبت‌های صریح (۵ / ۳ / ۴)، پس در هر عرضی متوازن می‌ماند.
//
//   ۲) **شماره‌ی تلفن بهم‌ریخته:** علتِ دقیقش این بود که روی یک عنصرِ `flex`، هم‌زمان
//      `dir="ltr"` گذاشته شده بود. `dir` جهتِ چیدمانِ آیتم‌های فلکس را هم برمی‌گرداند، پس آیکون
//      و شماره در جهتِ مخالفِ بقیه‌ی فوتر می‌نشستند و ردیف ناهماهنگ به‌نظر می‌رسید. حالا شماره
//      یک «چیپ» مستقل با پس‌زمینه‌ی اختصاصی است: ظرفِ بیرونی جهتِ RTL صفحه را نگه می‌دارد و فقط
//      خودِ رشته‌ی عدد داخل یک `<bdi dir="ltr">` قرار می‌گیرد — یعنی شماره همیشه درست و از چپ
//      به راست خوانده می‌شود، بدون این‌که چیدمانِ اطرافش را بهم بزند.
//
//   ۳) **ترازِ ناهماهنگ:** سرستون‌ها و لینک‌ها ترازهای متفاوتی می‌گرفتند. حالا روی موبایل همه‌چیز
//      وسط‌چین و از `sm` به بالا راست‌چین است — یکدست، با یک نشانگرِ کوچکِ رنگی زیر هر سرستون.
//
//   ۴) **هدف لمس (Touch target):** لینک‌های فوتر ارتفاع مشخصی نداشتند و روی موبایل زدنشان سخت
//      بود. حالا هرکدام حداقل ۴۴px ارتفاع مؤثر دارند.
//
// **حذف گوگل‌پلی:** طبق تصمیم صریح کارفرما، اپلیکیشن در گوگل‌پلی منتشر نمی‌شود؛ فقط یک لینک
// دانلود مستقیم فایل نصب اندروید (APK) بعداً اینجا قرار می‌گیرد. تا وقتی
// src/lib/config/appLinks.ts خالی است، دکمه به‌صورت «به‌زودی» غیرفعال می‌ماند.
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

  // شماره‌ی تماس بدون فاصله — فقط برای مقدارِ href="tel:"؛ متنِ نمایشی همان نسخه‌ی خواناست.
  const phoneHref = `tel:${dict.contact.phoneVal.replace(/\s/g, "")}`;

  return (
    <footer className="mt-8 border-t border-on-dark-border bg-hero-dark w-full">
      {/* ───────── بخش اصلی: سه ستونِ متوازن ───────── */}
      <div className="w-full px-6 sm:px-8 md:px-12 py-10 md:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 text-center sm:text-right">

        {/* ستون ۱ — برند و معرفی */}
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-5">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/yakja-icon-64.png"
              alt=""
              className="w-10 h-10 rounded-xl shrink-0 border border-on-dark-border"
            />
            <span className="font-extrabold text-on-dark text-lg">{dict.contact.brandVal}</span>
          </div>
          <p className="text-sm text-on-dark-muted leading-relaxed max-w-md mx-auto sm:mx-0">
            {dict.footer.aboutUsText}
          </p>
        </div>

        {/* ستون ۲ — دسترسی */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <h3 className="font-extrabold text-on-dark text-sm flex flex-col items-center sm:items-start gap-1.5">
            {dict.footer.quickLinksTitle}
            <span className="block h-[3px] w-8 rounded-full bg-accent" />
          </h3>
          <ul className="flex flex-col">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex items-center justify-center sm:justify-start gap-1.5 min-h-[44px] text-sm text-on-dark-muted hover:text-primary transition-colors"
                >
                  {/* نقطه‌ی کوچکِ نشانگر — فقط هنگام هاور پررنگ می‌شود */}
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-primary transition-colors shrink-0" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ستون ۳ — پشتیبانی */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          <h3 className="font-extrabold text-on-dark text-sm flex flex-col items-center sm:items-start gap-1.5">
            {dict.footer.supportTitle}
            <span className="block h-[3px] w-8 rounded-full bg-primary" />
          </h3>

          {/* چیپِ شماره‌ی تماس — پس‌زمینه‌ی اختصاصی (درخواست کارفرما).
              نکته‌ی مهم: dir="ltr" فقط روی خودِ <bdi> عددی است، نه روی ظرفِ فلکس؛ وگرنه دوباره
              جای آیکون و متن برعکس می‌شد. شفافیتِ پس‌زمینه/حاشیه از [0.07]/[0.15] به [0.1]/[0.25]
              بالا رفت — روی زمینه‌ی تیره‌ی تازه، تُنِ خیلی کم‌رنگِ قبلی تقریباً دیده نمی‌شد. */}
          <a
            href={phoneHref}
            className="inline-flex items-center justify-center sm:justify-start gap-2.5 rounded-2xl bg-primary/10 border border-primary/25 px-4 min-h-[52px] w-full sm:w-auto sm:self-start hover:bg-primary/[0.18] hover:border-primary/40 active:scale-[0.98] transition-all"
          >
            <span className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Icons.Phone className="w-[18px] h-[18px] text-primary" />
            </span>
            <span className="flex flex-col items-start leading-tight min-w-0">
              <span className="text-[11px] font-semibold text-on-dark-muted">
                {dict.footer.callButton}
              </span>
              <bdi dir="ltr" className="text-[15px] font-extrabold text-primary tracking-wide">
                {dict.contact.phoneVal}
              </bdi>
            </span>
          </a>

          <Link
            href={`/${lang}/contact`}
            className="group flex items-center justify-center sm:justify-start gap-1.5 min-h-[44px] text-sm text-on-dark-muted hover:text-primary transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-primary transition-colors shrink-0" />
            {dict.footer.contact}
          </Link>
        </div>
      </div>

      {/* ───────── نوار دانلود اپلیکیشن ───────── */}
      <div className="border-t border-on-dark-border w-full bg-hero-dark-elevated">
        <div className="w-full px-6 sm:px-8 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3 text-center sm:text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/yakja-icon-64.png"
              alt=""
              className="w-11 h-11 rounded-xl shrink-0 border border-on-dark-border hidden sm:block"
            />
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-on-dark">{dict.home.appDownload.title}</p>
              <p className="text-xs text-on-dark-muted leading-relaxed max-w-md mt-0.5">
                {dict.home.appDownload.subtitle}
              </p>
            </div>
          </div>

          {hasAppLink ? (
            <a
              href={ANDROID_APP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary text-white px-6 min-h-[48px] font-bold text-sm shrink-0 w-full sm:w-auto hover:bg-primary-dark active:scale-[0.98] transition-all"
            >
              <Icons.Android className="w-5 h-5" />
              {dict.home.appDownload.androidButton}
            </a>
          ) : (
            <span className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 text-on-dark-muted px-6 min-h-[48px] font-bold text-sm shrink-0 w-full sm:w-auto cursor-not-allowed border border-on-dark-border">
              <Icons.Android className="w-5 h-5" />
              {dict.footer.androidComingSoon}
            </span>
          )}
        </div>
      </div>

      {/* ───────── نوار پایانی ───────── */}
      <div className="border-t border-on-dark-border px-6 py-5 flex flex-col items-center gap-1.5 text-center">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-on-dark-muted">
          {dict.footer.madeWithLoveBefore}
          <Icons.Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
          {dict.footer.madeWithLoveAfter}
        </span>
        <span className="text-xs font-semibold text-on-dark-muted/70">{dict.footer.copyright}</span>
      </div>
    </footer>
  );
}