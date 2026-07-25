// مسیر فایل: src/app/not-found.tsx
// شبکه‌ی ایمنی ۴۰۴ برای مسیرهایی که حتی به الگوی src/app/[lang] هم نمی‌خورند (موارد لبه‌ای و
// نادر). چون این فایل بیرون از segment زبان‌هاست، به دیکشنری دسترسی ندارد؛ به همین دلیل متنش
// ساده و مستقل از زبان است. تقریباً همه‌ی ۴۰۴های واقعی کاربران را نسخه‌ی کامل و چندزبانه‌ی
// src/app/[lang]/not-found.tsx پوشش می‌دهد — این فایل فقط برای اطمینان است.
// توجه: چون src/app/layout.tsx از قبل تگ‌های <html>/<body> را می‌سازد، اینجا فقط باید محتوای
// داخل صفحه برگردانده شود، نه یک سند HTML کامل دیگر.
import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center bg-white">
      <span className="text-6xl font-black text-slate-200 select-none">404</span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-extrabold text-slate-800 text-lg">این صفحه پیدا نشد</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
          لینک مورد نظر یافت نشد. از اینجا می‌توانید به صفحه‌ی اصلی برگردید.
        </p>
      </div>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-sm px-6 py-3 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
