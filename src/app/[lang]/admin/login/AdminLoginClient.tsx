// مسیر فایل: src/app/[lang]/admin/login/AdminLoginClient.tsx
// تسک ۱ فاز ۰۷ — فرم ورود مدیر (نام‌کاربری+رمزعبور)؛ دقیقاً هم‌الگو با
// src/app/[lang]/auth/login/LoginClient.tsx از نظر ساختار (useState/useTransition/Toast)، اما
// بدون هیچ اتصالی به OTP یا شماره‌موبایل.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { adminLoginAction } from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

export function AdminLoginClient({ lang, dict }: { lang: string; dict: Dict }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  const errorText = (errorCode: string) => {
    const dictErrors = dict.admin.login.errors as Record<string, string>;
    return dictErrors[errorCode] ?? dictErrors.generic;
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await adminLoginAction(username, password);
      if (!result.success) {
        const message = errorText(result.error);
        setError(message);
        showToast(message, "error");
        return;
      }
      router.push(`/${lang}/admin`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={dict.admin.login.usernameLabel}
        placeholder={dict.admin.login.usernamePlaceholder}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        dir="ltr"
        autoComplete="username"
        error={error ?? undefined}
        disabled={isPending}
      />
      <Input
        label={dict.admin.login.passwordLabel}
        placeholder={dict.admin.login.passwordPlaceholder}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        dir="ltr"
        type="password"
        autoComplete="current-password"
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />
      <Button
        variant="primary"
        fullWidth
        loading={isPending}
        disabled={isPending || username.trim().length === 0 || password.length === 0}
        onClick={handleSubmit}
      >
        {isPending ? dict.admin.login.submitting : dict.admin.login.submit}
      </Button>
    </div>
  );
}