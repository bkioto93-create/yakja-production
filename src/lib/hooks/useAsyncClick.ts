// مسیر فایل: src/lib/hooks/useAsyncClick.ts
// یک هوک کوچک و بدون هیچ وابستگی بیرونی: هر عملیات async (ثبت فرم، حذف، لایک، ارسال سرور اکشن،
// هرچی) را به یک وضعیت isLoading وصل می‌کند و تا وقتی عملیات قبلی تمام نشده، اجازه‌ی اجرای دوباره
// نمی‌دهد — دقیقاً همان چیزی که جلوی «چند بار زدن پشت‌سرهم روی دکمه» را می‌گیرد.
//
// نمونه‌ی استفاده:
//   const { isLoading, run } = useAsyncClick(async () => {
//     await someServerAction(id);
//   });
//   <Button isLoading={isLoading} onClick={run}>حذف آگهی</Button>
"use client";

import { useCallback, useRef, useState } from "react";

export function useAsyncClick<Args extends unknown[]>(
  action: (...args: Args) => Promise<void> | void
) {
  const [isLoading, setIsLoading] = useState(false);
  const isRunningRef = useRef(false);

  const run = useCallback(
    async (...args: Args) => {
      if (isRunningRef.current) return; // یک عملیات در حال اجراست؛ کلیک دوباره را نادیده بگیر
      isRunningRef.current = true;
      setIsLoading(true);
      try {
        await action(...args);
      } finally {
        isRunningRef.current = false;
        setIsLoading(false);
      }
    },
    [action]
  );

  return { isLoading, run };
}
