// مسیر فایل: src/components/pwa/ServiceWorkerRegister.tsx
// تسک ۲ فاز ۰۸ — ثبت public/sw.js در مرورگر. این کامپوننت هیچ خروجی بصری ندارد (return null)؛
// تنها وظیفه‌اش صدازدن navigator.serviceWorker.register(...) یک‌بار، بعد از mount شدن اپ، است —
// دقیقاً هم‌الگو با سایر کامپوننت‌های «فقط-اثر-جانبی» پروژه مثل LangHtmlSync.tsx.
//
// عمداً در محیط توسعه (npm run dev) ثبت نمی‌شود: در حالت dev، Next.js صفحات را با Fast Refresh و
// بدون کش دوباره می‌سازد؛ اگر Service Worker همان‌جا هم فعال بود، توسعه‌دهنده گاهی نسخه‌ی کش‌شده‌ی
// قدیمی را می‌دید و گمان می‌کرد تغییرش اعمال نشده. process.env.NODE_ENV در بیلد Next.js همیشه در
// زمان کامپایل جایگزین می‌شود، پس این بررسی هیچ هزینه‌ی زمان‌اجرا یا نشتی به کد سمت مرورگر ندارد.
//
// وقتی نسخه‌ی تازه‌ای از Service Worker نصب و کنترل صفحه را به‌دست می‌گیرد (یعنی کاربر پیش‌تر هم
// این اپ را باز کرده و حالا بیلد جدیدی منتشر شده)، یک‌بار و فقط یک‌بار صفحه به‌صورت خودکار
// رفرش می‌شود تا کاربر همیشه آخرین نسخه را ببیند — بدون نیاز به هیچ متن/دکمه‌ی تازه‌ای در رابط
// کاربری (پس نیازی به کلید دیکشنری جدید نبود).
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshedOnce = false;

    function handleControllerChange() {
      if (refreshedOnce) return;
      refreshedOnce = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ثبت Service Worker شکست خورد (مثلاً مرورگرهای قدیمی/حالت خصوصی برخی مرورگرها) — اپ باید
      // دقیقاً مثل قبل از این تسک، بدون هیچ قابلیت آفلاین/کشِ اضافه، به‌درستی کار کند؛ پس خطا
      // عمداً بی‌صدا نادیده گرفته می‌شود.
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}