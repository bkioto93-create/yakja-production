// مسیر فایل: src/app/[lang]/auth/login/LoginClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { requestOtpAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

export function LoginClient({ lang, dict }: { lang: string; dict: Dict }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  const errorText = (errorCode: string, seconds?: number) => {
    const dictErrors = dict.auth.errors as Record<string, string>;
    const template = dictErrors[errorCode] ?? dictErrors.generic;
    return typeof seconds === "number" ? template.replace("{seconds}", String(seconds)) : template;
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction(phone);
      if (!result.success) {
        const message = errorText(result.error, result.retryAfterSeconds);
        setError(message);
        showToast(message, "error");
        return;
      }
      router.push(`/${lang}/auth/verify?phone=${encodeURIComponent(result.phoneNumber)}`);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={dict.auth.login.phoneLabel}
        placeholder={dict.auth.login.phonePlaceholder}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        dir="ltr"
        inputMode="tel"
        type="tel"
        error={error ?? undefined}
        disabled={isPending}
      />
      <Button
        variant="primary"
        fullWidth
        loading={isPending}
        disabled={isPending || phone.trim().length === 0}
        onClick={handleSubmit}
      >
        {isPending ? dict.auth.login.sending : dict.auth.login.submit}
      </Button>
    </div>
  );
}