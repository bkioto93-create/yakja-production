// مسیر فایل: src/components/chat/AdminSupportChatEntry.tsx
// فاز ۱۳ — ورودی مشترکِ «چت با پشتیبانی/مدیریت»، برای استفاده در ۳ نقطه‌ی مختلف اپ:
// ۱) صفحه‌ی پروفایل (src/app/[lang]/profile/ProfileClient.tsx)
// ۲) صفحه‌ی تماس با ما (src/app/[lang]/contact/page.tsx)
// ۳) بالای فهرست «چت‌های من» به‌صورت یک ردیف ثابت/پین‌شده (src/app/[lang]/chat/page.tsx)
//
// دقیقاً هم‌روح با src/components/chat/ChatButton.tsx: برای کاربر مهمان (viewerId=null)، به‌جای
// صدازدن اکشن، مستقیم به صفحه‌ی ورود لینک می‌دهد.
//
// دو حالت ظاهری (variant):
// - "card": کارت بزرگ با آیکون/عنوان/توضیح — برای پروفایل و تماس با ما.
// - "listItem": ردیف هم‌شکل با بقیه‌ی ردیف‌های فهرست چت‌ها — برای بالای صفحه‌ی /chat.
//
// اگر existingConversationId از قبل مشخص باشد (یعنی صفحه‌ی فراخوان از قبل آن را خوانده،
// مثل chat/page.tsx که به‌هرحال getMyConversations را صدا زده)، کلیک مستقیم Link است — بدون
// صدازدن دوباره‌ی اکشن سرور. در غیر این صورت (پروفایل/تماس با ما، که این اطلاعات را جلوتر
// نخوانده‌اند)، کلیک اکشن idempotent سرور را صدا می‌زند (اگر گفتگو از قبل بود همان را برمی‌گرداند،
// وگرنه یکی تازه با status='pending' می‌سازد).
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { startAdminSupportConversationAction } from "@/app/[lang]/chat/actions";
import type { Locale } from "@/lib/i18n/constants";

export type AdminSupportChatDict = {
  title: string;
  description: string;
  startButton: string;
  loginRequiredButton: string;
  errors: Record<string, string>;
};

export function AdminSupportChatEntry({
  lang,
  viewerId,
  variant,
  existingConversationId = null,
  subtitle,
  dict,
  className = "",
}: {
  lang: Locale;
  viewerId: string | null;
  variant: "card" | "listItem";
  existingConversationId?: string | null;
  // فقط برای variant="listItem" استفاده می‌شود — متن پویا (پیش‌نمایش آخرین پیام یا نشان
  // «در انتظار پاسخ»)؛ اگر داده نشود، dict.description جایگزین می‌شود.
  subtitle?: string;
  dict: AdminSupportChatDict;
  className?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const displaySubtitle = subtitle ?? dict.description;

  function handleClick() {
    if (existingConversationId) {
      router.push(`/${lang}/chat/${existingConversationId}`);
      return;
    }
    startTransition(async () => {
      const result = await startAdminSupportConversationAction();
      if (!result.success) {
        showToast(dict.errors[result.error] ?? dict.errors.generic, "error");
        return;
      }
      router.push(`/${lang}/chat/${result.conversationId}`);
    });
  }

  const iconBlock = (
    <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
      <Icons.MessageSquare className="w-5 h-5" />
    </div>
  );

  if (variant === "listItem") {
    const content = (
      <div className="p-3.5 flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-primary/15 active:scale-[0.98] transition-transform">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          {isPending ? <Spinner className="w-5 h-5" /> : <Icons.MessageSquare className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-bold text-text-main truncate">{dict.title}</span>
          <span className="text-xs text-text-muted truncate">{displaySubtitle}</span>
        </div>
      </div>
    );

    if (!viewerId) {
      return (
        <Link href={`/${lang}/auth/login`} className={className}>
          {content}
        </Link>
      );
    }

    return (
      <button type="button" onClick={handleClick} disabled={isPending} className={`w-full text-right ${className}`}>
        {content}
      </button>
    );
  }

  // variant === "card"
  if (!viewerId) {
    return (
      <Link
        href={`/${lang}/auth/login`}
        className={`flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-[0.98] transition-transform ${className}`}
      >
        {iconBlock}
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="font-bold text-text-main text-sm">{dict.title}</span>
          <span className="text-xs text-text-muted">{dict.description}</span>
        </div>
        <Icons.ArrowRight className="w-4 h-4 text-text-muted rotate-180 shrink-0" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-[0.98] transition-transform text-right disabled:opacity-60 ${className}`}
    >
      {iconBlock}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="font-bold text-text-main text-sm">{dict.title}</span>
        <span className="text-xs text-text-muted">{dict.description}</span>
      </div>
      {isPending ? (
        <Spinner className="w-4 h-4 text-text-muted shrink-0" />
      ) : (
        <Icons.ArrowRight className="w-4 h-4 text-text-muted rotate-180 shrink-0" />
      )}
    </button>
  );
}