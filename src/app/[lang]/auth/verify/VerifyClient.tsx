// مسیر فایل: src/app/[lang]/auth/verify/VerifyClient.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { verifyOtpAction, resendOtpAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyClient({
  lang,
  dict,
  phoneNumber,
}: {
  lang: string;
  dict: Dict;
  phoneNumber: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isVerifying, startVerifying] = useTransition();
  const [isResending, startResending] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const errorText = (errorCode: string, seconds?: number) => {
    const dictErrors = dict.auth.errors as Record<string, string>;
    const template = dictErrors[errorCode] ?? dictErrors.generic;
    return typeof seconds === "number" ? template.replace("{seconds}", String(seconds)) : template;
  };

  const handleVerify = () => {
    setError(null);
    startVerifying(async () => {
      const result = await verifyOtpAction(phoneNumber, code, lang);
      if (!result.success) {
        const message = errorText(result.error);
        setError(message);
        showToast(message, "error");
        return;
      }
      showToast(dict.auth.verify.loginSuccess, "success");
      // تسک ۱ فاز ۰۷: پیش از این، کاربر با role='admin' مستقیماً به /admin هدایت می‌شد. حالا که
      // پنل مدیریت مسیر ورود کاملاً مجزا دارد (/admin/login)، ورود از طریق OTP عمومی، صرف‌نظر از
      // نقش کاربر، همیشه به صفحه‌ی اصلی می‌رود؛ requireAdmin هم دیگر نشست OTP را برای /admin
      // نمی‌پذیرد (رجوع کنید به src/lib/auth/session.ts).
      router.push(`/${lang}`);
      router.refresh();
    });
  };

  const handleResend = () => {
    setError(null);
    startResending(async () => {
      const result = await resendOtpAction(phoneNumber);
      if (!result.success) {
        const message = errorText(result.error, result.retryAfterSeconds);
        setError(message);
        showToast(message, "error");
        if (result.retryAfterSeconds) setCooldown(result.retryAfterSeconds);
        return;
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showToast(dict.auth.verify.codeSent, "success");
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={dict.auth.verify.codeLabel}
        placeholder={dict.auth.verify.codePlaceholder}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        dir="ltr"
        inputMode="numeric"
        className="text-center text-xl tracking-[0.5em] font-bold"
        error={error ?? undefined}
        disabled={isVerifying}
      />
      <Button
        variant="primary"
        fullWidth
        loading={isVerifying}
        disabled={isVerifying || code.length !== 6}
        onClick={handleVerify}
      >
        {isVerifying ? dict.auth.verify.verifying : dict.auth.verify.submit}
      </Button>

      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/auth/login`)}
          className="text-text-muted font-semibold underline underline-offset-2"
        >
          {dict.auth.verify.changeNumber}
        </button>

        {cooldown > 0 ? (
          <span className="text-text-muted">
            {dict.auth.verify.resendIn.replace("{seconds}", String(cooldown))}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary font-bold disabled:opacity-50"
          >
            {dict.auth.verify.resend}
          </button>
        )}
      </div>
    </div>
  );
}