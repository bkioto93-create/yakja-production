// مسیر فایل: src/components/ui/Card.tsx
export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const isInteractive = !!onClick;
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${
        isInteractive ? "active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}