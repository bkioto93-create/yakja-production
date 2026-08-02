// مسیر فایل: src/app/[lang]/chat/[id]/page.tsx
// فاز ۱۲ — صفحه‌ی یک گفتگوی مشخص. کنترل دسترسی واقعی همین‌جا انجام می‌شود:
// getConversationForUser فقط اگر کاربر جاری واقعاً یکی از دو طرف گفتگو باشد چیزی برمی‌گرداند؛
// در غیر این صورت (گفتگوی متعلق به کس دیگر، یا گفتگوی ناموجود/پاک‌شده) همان صفحه‌ی خالی «یافت
// نشد» نمایش داده می‌شود — دقیقاً هم‌الگو با صفحه‌ی جزئیات آگهی برای شناسه‌ی نامعتبر.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationForUser, getConversationMessages } from "@/lib/chat/chatQueries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ChatThreadClient } from "./ChatThreadClient";
import type { Locale } from "@/lib/i18n/constants";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const chatDict = dict.chat;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{chatDict.loginRequiredTitle}</h2>
          <p className="text-sm text-text-muted">{chatDict.loginRequiredDesc}</p>
          <Link href={`/${lang}/auth/login`} className="w-full">
            <Button variant="primary" fullWidth>
              {chatDict.loginRequiredButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const conversation = await getConversationForUser(id, user.id, chatDict.contextFallbackLabel);

  if (!conversation) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{chatDict.notFoundTitle}</h2>
          <p className="text-sm text-text-muted">{chatDict.notFoundDesc}</p>
          <Link href={`/${lang}/chat`} className="w-full">
            <Button variant="primary" fullWidth>
              {chatDict.backToListButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const messages = await getConversationMessages(id);

  return (
    <ChatThreadClient
      lang={lang as Locale}
      dict={dict}
      viewerId={user.id}
      conversation={conversation}
      initialMessages={messages}
    />
  );
}