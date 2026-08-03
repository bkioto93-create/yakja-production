// مسیر فایل: src/app/[lang]/chat/page.tsx
// فاز ۱۲ — صفحه‌ی «چت‌های من»: فهرست همه‌ی گفتگوهایی که کاربر یا آغازکننده‌شان بوده یا صاحبِ
// آگهی/پروفایل مقابل بوده، دقیقاً هم‌الگو با src/app/[lang]/vip/page.tsx برای حالت کاربر مهمان.
//
// **به‌روزرسانی فاز ۱۳ (چت با مدیر/پشتیبانی):**
// ۱) یک ردیف ثابت («چت با پشتیبانی») همیشه بالای فهرست نشان داده می‌شود — فقط برای کاربر عادی
//    واردشده (نه خودِ حساب ادمین؛ نه کاربر مهمان که اصلاً این صفحه را نمی‌بیند). این ردیف همیشه
//    همان یک گفتگوی پشتیبانیِ کاربر را باز می‌کند (یا اگر هنوز شروع نشده، یکی تازه می‌سازد).
// ۲) چون این یک گفتگو (در صورت وجود) از قبل داخل نتیجه‌ی getMyConversations هست، برای جلوگیری از
//    نمایش تکراری، از فهرست معمولیِ پایین فیلتر می‌شود (isAdminSupportChat).
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyConversations } from "@/lib/chat/chatQueries";
import { VipBadge } from "@/components/vip/VipBadge";
import { AdminSupportChatEntry } from "@/components/chat/AdminSupportChatEntry";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import type { Locale } from "@/lib/i18n/constants";

export const dynamic = "force-dynamic";

export default async function ChatListPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
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

  const isAdminViewer = user.role === "admin";

  const conversations = await getMyConversations(
    user.id,
    chatDict.contextFallbackLabel,
    chatDict.voiceMessagePreview,
    chatDict.adminSupport.label
  );

  // فاز ۱۳ — گفتگوی پشتیبانیِ خودِ همین کاربر (در صورت وجود) از فهرست معمولی جدا می‌شود تا به‌جای
  // یک ردیف معمولی، در همان ردیف ثابت بالای صفحه نمایش داده شود. برای خودِ ادمین این کار انجام
  // نمی‌شود — ادمین باید همه‌ی گفتگوهای پشتیبانیِ کاربران را عادی، مثل بقیه‌ی گفتگوها، در همین
  // فهرست ببیند.
  const supportConversation = !isAdminViewer
    ? (conversations.find((c) => c.isAdminSupportChat) ?? null)
    : null;
  const listConversations = !isAdminViewer
    ? conversations.filter((c) => !c.isAdminSupportChat)
    : conversations;

  const supportSubtitle = supportConversation
    ? supportConversation.status === "active"
      ? supportConversation.lastMessagePreview || chatDict.noMessagesYet
      : chatDict.adminSupport.pendingListBadge
    : chatDict.adminSupport.description;

  return (
    <div className="flex flex-col gap-4 px-4 md:px-0 py-6 max-w-lg md:max-w-xl mx-auto w-full">
      <h1 className="text-xl font-extrabold text-text-main">{chatDict.listTitle}</h1>

      {!isAdminViewer && (
        <AdminSupportChatEntry
          lang={lang as Locale}
          viewerId={user.id}
          variant="listItem"
          existingConversationId={supportConversation?.id ?? null}
          subtitle={supportSubtitle}
          dict={{
            title: chatDict.adminSupport.label,
            description: chatDict.adminSupport.description,
            startButton: chatDict.adminSupport.startButton,
            loginRequiredButton: chatDict.loginRequiredButton,
            errors: chatDict.button.errors,
          }}
        />
      )}

      {listConversations.length === 0 ? (
        <Card className="p-6 flex flex-col items-center text-center gap-2 mt-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.MessageSquare className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-text-main">{chatDict.emptyTitle}</h2>
          <p className="text-sm text-text-muted max-w-xs">{chatDict.emptyDesc}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {listConversations.map((conv) => (
            <Link key={conv.id} href={`/${lang}/chat/${conv.id}`}>
              <Card className="p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
                  {conv.contextImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={conv.contextImageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icons.MessageSquare className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-text-main truncate">
                      {conv.otherUserName || chatDict.unknownUser}
                    </span>
                    {conv.otherUserIsVip && <VipBadge label={dict.vip.badgeLabel} />}
                  </div>
                  <span className="text-xs text-text-muted truncate">{conv.contextLabel}</span>
                  {/* فاز ۱۳ — برای خودِ ادمین، گفتگوی پشتیبانیِ هنوز در انتظار/ردشده با یک نشان
                      کوچک متمایز می‌شود تا بدون باز کردن هرکدام هم وضعیتش مشخص باشد. */}
                  {conv.isAdminSupportChat && conv.status !== "active" ? (
                    <span className="text-xs font-bold text-primary truncate">
                      {chatDict.adminSupport.pendingListBadge}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted truncate">
                      {conv.lastMessagePreview || chatDict.noMessagesYet}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}