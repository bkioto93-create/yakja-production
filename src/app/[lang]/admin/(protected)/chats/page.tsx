// مسیر فایل: src/app/[lang]/admin/(protected)/chats/page.tsx
// فاز ۱۳ — صفحه‌ی «چت‌ها»ی پنل مدیریت. دسترسی ادمین از قبل توسط
// src/app/[lang]/admin/(protected)/layout.tsx تضمین شده — دقیقاً هم‌الگو با admin/vip/page.tsx.
//
// سه تب وضعیت (در انتظار تایید/فعال/ردشده) با صفحه‌بندی — همان الگوی Link + query string که در
// admin/vip/page.tsx و admin/listings/page.tsx استفاده شده.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getAdminChatRequestsPage } from "@/lib/admin/adminChatQueries";
import { AdminChatsTable } from "./AdminChatsTable";
import type { ConversationStatus } from "@/lib/chat/chatQueries";

export const dynamic = "force-dynamic";

const STATUSES: ConversationStatus[] = ["pending", "active", "rejected"];

export default async function AdminChatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { lang } = await params;
  const { status: rawStatus, page: rawPage } = await searchParams;

  const activeStatus: ConversationStatus = STATUSES.includes(rawStatus as ConversationStatus)
    ? (rawStatus as ConversationStatus)
    : "pending";
  const page = Number(rawPage) > 0 ? Number(rawPage) : 1;

  const dict = await getDictionary(lang);
  const adminChatsDict = dict.admin.chats;

  const { items, totalCount, pageSize } = await getAdminChatRequestsPage({
    status: activeStatus,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hrefFor = (status: ConversationStatus, p: number) => `/${lang}/admin/chats?status=${status}&page=${p}`;

  const tableDict = {
    unknownUser: adminChatsDict.unknownUser,
    requestedAtLabel: adminChatsDict.requestedAtLabel,
    respondedAtLabel: adminChatsDict.respondedAtLabel,
    messagePreviewLabel: adminChatsDict.messagePreviewLabel,
    noMessageYet: adminChatsDict.noMessageYet,
    approveButton: adminChatsDict.approveButton,
    declineButton: adminChatsDict.declineButton,
    openChatButton: adminChatsDict.openChatButton,
    updateError: adminChatsDict.updateError,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-extrabold text-lg text-text-main">{adminChatsDict.title}</h1>
        <p className="text-sm text-text-muted">{adminChatsDict.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100 pb-2">
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={hrefFor(status, 1)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 ${
                activeStatus === status
                  ? "bg-primary text-white"
                  : "text-text-muted bg-slate-50 hover:bg-slate-100"
              }`}
            >
              {adminChatsDict.statusLabels[status]}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-10">{adminChatsDict.empty}</p>
        ) : (
          <AdminChatsTable lang={lang} items={items} dict={tableDict} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={hrefFor(activeStatus, p)}
                className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-bold ${
                  p === page ? "bg-primary text-white" : "bg-slate-50 text-text-muted"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}