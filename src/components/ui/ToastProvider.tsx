// مسیر فایل: src/components/ui/ToastProvider.tsx
// مدیر استیت قدرتمند هشدارهای تعاملی کاملاً درون مرزی و سَبک 
"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { Icons } from "./Icons";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove alert float panel without requiring external state engines limit size footprint over network speeds 2g/3g
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* The floating layout logic wrapper / ثابت برای نمایشات به جهت خواندن متون و پیامهای شبکه PWA/آنتن‌دهی */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-2 pointer-events-none px-4 w-full sm:max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center shadow-lg rounded-2xl px-5 py-3 w-full border border-black/5 animate-slide-down pointer-events-auto ${
              toast.type === "error" ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-800"
            }`}
          >
            {toast.type === "success" && <Icons.CheckCircle className="w-6 h-6 ml-3 shrink-0" />}
            {toast.type === "error" && <Icons.AlertCircle className="w-6 h-6 ml-3 shrink-0" />}
            <span className="font-semibold text-sm leading-snug text-right w-full">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// برای استفاده مستقیم در هر صفحه‌ای `const { showToast } = useToast();`
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside a ToastProvider");
  return ctx;
}