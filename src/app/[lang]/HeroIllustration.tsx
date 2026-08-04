// مسیر فایل: src/app/[lang]/HeroIllustration.tsx
// ارتقای بصری حرفه‌ای: این کامپوننت حالا به‌عنوان یک محفظه‌ی (Wrapper) پیشرفته عمل می‌کند.
// با اضافه‌شدن هاله‌های نوری (Glow) در پس‌زمینه و افکت‌های ترانزیشن (Hover Scale & Translate)،
// تصویر سه‌بعدی ثابت شما حس یک آبجکت شناور و زنده (Premium 3D Mockup) را به کاربر منتقل می‌کند.
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center group ${className ?? ""}`}>
      {/* افکت درخشش ملایم و مدرن پشت عکس (Glassmorphism Glow) */}
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full mix-blend-screen pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
      
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-icon.png"
        alt="یکجا | پلتفرم جامع"
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl group-hover:-translate-y-3 group-hover:scale-[1.02] transition-all duration-700 ease-out"
      />
    </div>
  );
}