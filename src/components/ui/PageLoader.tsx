// مسیر فایل: src/components/ui/PageLoader.tsx
// نمای لودینگِ سراسری — به‌صورت خودکار توسط Next.js وقتی کاربر به هر صفحه یا تبی می‌رود که
// واکشی داده دارد، نشان داده می‌شود. کافی است فایل‌های loading.tsx همین یک کامپوننت را رندر کنند؛
// نیازی به دست‌زدن تک‌تک صفحه‌ها نیست، چون Next.js خودش هر segment را دور یک Suspense boundary
// با فال‌بک این فایل می‌پیچد (قوانین App Router).
//
// عمداً به هیچ دیکشنری زبان (fa/ps) وابسته نیست: فایل‌های loading.tsx در Next.js هیچ‌وقت پارامتر
// زبان را دریافت نمی‌کنند، پس فقط از نام برند «یکجا» استفاده شده که در هر دو زبان یکسان نوشته
// می‌شود و نیازی به ترجمه ندارد — دقیقاً مثل یک اسپلش‌اسکرین کوتاه.
import { Spinner } from "./Spinner";

export function PageLoader({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center gap-4 ${
        compact ? "min-h-[30vh]" : "min-h-[55vh]"
      }`}
    >
      <div className="relative w-14 h-14 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <span className="relative w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Spinner className="w-7 h-7 text-primary" label="یکجا در حال بارگذاری است" />
        </span>
      </div>
      <span className="text-sm font-extrabold text-primary tracking-wide select-none">
        یکجا
      </span>
    </div>
  );
}
