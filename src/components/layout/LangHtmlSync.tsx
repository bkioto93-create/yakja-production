// مسیر فایل: src/components/layout/LangHtmlSync.tsx
// از آنجا که <html> حالا داخل src/app/layout.tsx (بیرون از [lang]) تعریف می‌شود، این کامپوننت
// کوچک، ویژگی lang همان تگ را در سمت کلاینت با زبان واقعیِ مسیر جاری (fa/ps) هماهنگ می‌کند.
// چیزی رندر نمی‌کند؛ فقط یک Side Effect است.
"use client";

import { useEffect } from "react";

export function LangHtmlSync({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
