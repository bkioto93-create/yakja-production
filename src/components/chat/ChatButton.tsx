// مسیر فایل: src/components/chat/ChatButton.tsx
// فاز ۱۲ — دکمه‌ی مشترک «چت با ...»، برای استفاده روی هر ۴ ماژول (کالا، حمل‌ونقل، خدمات، املاک)
// — دقیقاً هم‌روح با src/components/reports/ReportButton.tsx: یک کامپوننت مشترک، نه تکرار در هر
// ماژول؛ فقط contextType/contextId/ownerId فرق می‌کند.
//
// برای کاربر مهمان (viewerId=null)، به‌جای صدازدن اکشن، مستقیم به صفحه‌ی ورود لینک می‌دهد — دقیقاً
// همان الگوی «کارت دعوت به ورود» در بقیه‌ی فرم‌های پروژه، اما اینجا چون فضای دکمه محدود است
// (روی کارت راننده/متخصص)، به‌جای کارت کامل فقط خودِ دکمه لینک می‌شود.
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/ToastProvider";
import { startConversationAction } from "@/app/[lang]/chat/actions";
import type { ChatContextType } from "@/lib/chat/chatQueries";
import type { Locale } from "@/lib/i18n/constants";

export type ChatButtonDict = {
  label: string;
  errors: {
    cannotChatWithSelf: string;
    dailyLimitReached: string;
    dbError: string;
    generic: string;
  };
};

export function ChatButton({
  lang,
  viewerId,
  contextType,
  contextId,
  ownerId,
  dict,
  variant = "outline",
  fullWidth = false,
  className = "",
}: {
  lang: Locale;
  viewerId: string | null;
  contextType: ChatContextType;
  contextId: string;
  ownerId: string;
  dict: ChatButtonDict;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // صاحبِ خودِ آگهی/پروفایل، دکمه‌ی چت با خودش را نمی‌بیند.
  if (viewerId === ownerId) return null;

  if (!viewerId) {
    return (
      <Link href={`/${lang}/auth/login`} className={fullWidth ? "w-full" : undefined}>
        <Button variant={variant} fullWidth={fullWidth} className={className}>
          <Icons.MessageSquare className="w-5 h-5 ml-2" />
          {dict.label}
        </Button>
      </Link>
    );
  }

  function handleClick() {
    startTransition(async () => {
      const result = await startConversationAction(contextType, contextId, ownerId);
      if (!result.success) {
        showToast(dict.errors[result.error as keyof typeof dict.errors] ?? dict.errors.generic, "error");
        return;
      }
      router.push(`/${lang}/chat/${result.conversationId}`);
    });
  }

  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      loading={isPending}
      disabled={isPending}
      onClick={handleClick}
      className={className}
    >
      <Icons.MessageSquare className="w-5 h-5 ml-2" />
      {dict.label}
    </Button>
  );
}