// مسیر فایل: src/components/layout/DisclaimerModal.tsx
// تسک ۸ فاز ۰۲ — مودال تمام‌صفحه‌ی «پیام یک‌باره‌ی راهنما برای کاربران جدید»: تمام معاملات و
// پرداخت‌ها حضوری و خارج از اپلیکیشن انجام می‌شود؛ یکجا هیچ مسئولیتی در قبال تراکنش، کیفیت کالا
// یا صحت معامله نمی‌پذیرد. این کامپوننت سراسری است (در src/app/[lang]/layout.tsx رندر می‌شود)،
// یعنی در هر چهار ماژول و هر صفحه‌ی دیگر هم یک‌بار دیده می‌شود — نه فقط در ماژول کالا.
//
// عمداً وابسته به ورود کاربر (Session) نیست، چون گشت‌وگذار بدون ورود هم مجاز است؛ «کاربر جدید»
// در این تسک یعنی «کسی که برای اولین‌بار وارد اپ شده»، صرف‌نظر از اینکه حساب بسازد یا نه.
// عمداً با کلیک روی پس‌زمینه بسته نمی‌شود — این پیام ماهیت شفاف‌سازی/حقوقی دارد و نباید به‌صورت
// اتفاقی و بدون خواندن رد شود؛ تنها راه بستن، دکمه‌ی «متوجه شدم» است.
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { acknowledgeDisclaimerAction } from "@/lib/disclaimer/actions";

type DisclaimerDict = {
  title: string;
  message: string;
  acknowledgeButton: string;
};

export function DisclaimerModal({
  initiallyAcknowledged,
  dict,
}: {
  initiallyAcknowledged: boolean;
  dict: DisclaimerDict;
}) {
  const [visible, setVisible] = useState(!initiallyAcknowledged);
  const [isPending, startTransition] = useTransition();

  if (!visible) return null;

  function handleAcknowledge() {
    // بستن فوری در سمت کاربر، بدون انتظار برای پاسخ سرور (تجربه‌ی سریع‌تر روی اینترنت ضعیف)؛
    // ثبت کوکی در پس‌زمینه انجام می‌شود.
    setVisible(false);
    startTransition(() => {
      acknowledgeDisclaimerAction();
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-5">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full flex flex-col items-center text-center gap-3 shadow-2xl animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Icons.Info className="w-7 h-7" />
        </div>
        <h2 className="font-extrabold text-text-main text-lg">{dict.title}</h2>
        <p className="text-sm text-text-muted leading-relaxed">{dict.message}</p>
        <Button variant="primary" fullWidth onClick={handleAcknowledge} disabled={isPending}>
          {dict.acknowledgeButton}
        </Button>
      </div>
    </div>
  );
}