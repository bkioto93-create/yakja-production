// مسیر فایل: src/app/[lang]/HeroIllustration.tsx
// **رفع باگ «آیکون بنر اسپلیت ناپدید می‌شود»:** نسخه‌ی قبلی این آیکون یک فایل جداگانه
// (public/images/hero-illustration.svg) بود که با تگ <img src="..."> صدا زده می‌شد. رایج‌ترین
// علت این‌که چنین تصویری گاهی روی هاست (Vercel، که روی لینوکس اجرا می‌شود و به حروف
// بزرگ/کوچک نام فایل حساس است) دیده نمی‌شود ولی روی ویندوز خودِ شما (که به حروف حساس نیست)
// مشکلی ندارد، دقیقاً همین حساسیت به حروف است؛ چون alt="" هم گذاشته بودیم (درست، برای تصویر
// تزئینی)، وقتی فایل لود نمی‌شد به‌جای نماد «تصویر خراب»، فقط یک فضای کاملاً خالی و نامرئی
// نمایش داده می‌شد — دقیقاً همان «ناپدید شدن» که گزارش کردید.
//
// راه‌حل قطعی: به‌جای رفرنس به یک فایل جداگانه، کد خودِ SVG مستقیم همین‌جا (به‌صورت یک
// Server Component ساده، بدون هیچ تعامل) قرار گرفته. یعنی از این به بعد این آیکون بخشی از
// خروجی کامپایل‌شده‌ی خودِ صفحه است؛ هیچ فایل جداگانه‌ای برای گم‌شدن، اشتباه بودن مسیر، یا کش
// شدن نادرست وجود ندارد — همیشه و قطعاً نمایش داده می‌شود.
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="yakjaHeroOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="yakjaHeroTeal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="84" height="84" rx="20" fill="#ffffff" />
      <rect x="108" y="8" width="84" height="84" rx="20" fill="#ffffff" />
      <rect x="8" y="108" width="84" height="84" rx="20" fill="#ffffff" />
      <rect x="108" y="108" width="84" height="84" rx="20" fill="#ffffff" />

      <circle cx="100" cy="100" r="15" fill="url(#yakjaHeroOrange)" />
      <circle cx="100" cy="100" r="15" fill="none" stroke="#ffffff" strokeWidth="3" />

      {/* جعبه (خرید و فروش کالا) */}
      <g transform="translate(32,32) scale(1.5)">
        <path
          d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
          fill="url(#yakjaHeroTeal)"
        />
        <polyline
          points="3.27 6.96 12 12.01 20.73 6.96"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <line x1="12" y1="22.08" x2="12" y2="12" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      </g>

      {/* وانت (حمل‌ونقل) */}
      <g transform="translate(132,32) scale(1.5)">
        <rect x="1" y="3" width="15" height="13" rx="1.5" fill="url(#yakjaHeroOrange)" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" fill="url(#yakjaHeroTeal)" />
        <rect x="4" y="6" width="6" height="5" rx="1" fill="#ffffff" opacity="0.9" />
        <circle cx="5.5" cy="18.5" r="2.6" fill="#0b4a55" />
        <circle cx="18.5" cy="18.5" r="2.6" fill="#0b4a55" />
        <circle cx="5.5" cy="18.5" r="1" fill="#ffffff" />
        <circle cx="18.5" cy="18.5" r="1" fill="#ffffff" />
      </g>

      {/* آچار (خدمات فنی) */}
      <g transform="translate(32,132) scale(1.5)">
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          fill="url(#yakjaHeroOrange)"
        />
      </g>

      {/* خانه (املاک) */}
      <g transform="translate(132,132) scale(1.5)">
        <polygon points="2,10 12,3 22,10" fill="url(#yakjaHeroOrange)" />
        <rect x="5" y="10" width="14" height="11" rx="2" fill="url(#yakjaHeroTeal)" />
        <rect x="9.3" y="13.3" width="2.7" height="2.7" rx="0.5" fill="#ffffff" />
        <rect x="12" y="13.3" width="2.7" height="2.7" rx="0.5" fill="#ffffff" />
        <rect x="9.3" y="16" width="2.7" height="2.7" rx="0.5" fill="#ffffff" />
        <rect x="12" y="16" width="2.7" height="2.7" rx="0.5" fill="#ffffff" />
      </g>
    </svg>
  );
}