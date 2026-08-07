// مسیر فایل: src/components/ui/Card.tsx
//
// 🛠️ بازطراحیِ کامل (تعمیقِ رنگِ بنر در سراسر اپ — دستور صریحِ کارفرما): حاشیه از
// border-slate-100 (خاکستریِ خنثی) به border-primary/10 تغییر کرد — یک تُنِ بسیار کم‌رنگِ
// فیروزه‌ای، معادلِ دقیقِ همین تغییر در components/ui/Card.tsx پروژه‌ی موبایل. سایه هم از
// shadow-sm خنثی به shadow-primary/5 تغییر کرد تا حتی سایه‌ی نرمِ زیرِ کارت هم کمی رنگِ برند
// بگیرد. چون Card در تقریباً هر صفحه‌ی اپ استفاده می‌شود، همین یک تغییرِ کوچک، حسِ برند را به‌آرامی
// در سراسر اپ پخش می‌کند.
export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const isInteractive = !!onClick;
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm shadow-primary/5 border border-primary/10 overflow-hidden ${
        isInteractive ? "active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md hover:shadow-primary/10" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}