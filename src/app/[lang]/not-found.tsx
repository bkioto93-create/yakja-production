// مسیر فایل: src/app/[lang]/not-found.tsx
// صفحه‌ی ۴۰۴ سراسری برای هر مسیری داخل src/app/[lang] که به صفحه‌ی واقعی‌ای نمی‌خورد — چه لینک
// خراب باشد، چه آگهی حذف‌شده، چه غلط تایپی در آدرس. Next.js این فایل را خودکار برای هر مسیر
// نامعتبر زیر این segment نشان می‌دهد، بدون نیاز به notFound() صریح در هر صفحه (هرچند صفحاتی که
// خودشان صریحاً notFound() صدا می‌زنند، مثلاً برای آگهی حذف‌شده، هم دقیقاً همین‌جا فرود می‌آیند).
//
// چون این فایل داخل layout همین segment قرار می‌گیرد، BottomNav و DesktopHeader سرجایشان
// می‌مانند و فقط محتوای وسط عوض می‌شود — کاربر گم نمی‌شود و همیشه راه برگشت جلوی چشمش هست.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";

export default async function LangNotFound({
  params,
}: {
  params?: Promise<{ lang: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const lang = resolvedParams?.lang ?? "fa";
  const dict = await getDictionary(lang);
  const t = dict.notFound;

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <svg viewBox="0 0 24 24" width={44} height={44} fill="none" className="text-primary" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 11h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <span className="text-5xl font-black text-primary/25 tracking-wide select-none">404</span>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-extrabold text-text-main text-lg">{t.title}</h1>
        <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">{t.message}</p>
      </div>

      <Link
        href={`/${lang}`}
        className="mt-2 inline-flex items-center justify-center rounded-2xl bg-primary text-white font-bold text-sm px-6 py-3 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {t.backHomeButton}
      </Link>
    </div>
  );
}
