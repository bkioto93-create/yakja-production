// مسیر فایل: src/components/chat/ChatRetentionNotice.tsx
// فاز ۱۲ — نوار هشدار «۲۴ ساعت نگهداری پیام‌ها»، طبق درخواست صریح کارفرما: چون زیرساخت فعلی
// محدود است، باید بالای صفحه‌ی هر گفتگو به‌طور واضح به کاربر گفته شود که پیام‌ها ماندگار نیستند.
import { Icons } from "@/components/ui/Icons";

export function ChatRetentionNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      <Icons.Info className="w-[18px] h-[18px] shrink-0 text-amber-500 mt-0.5" />
      <p className="text-xs text-amber-700 leading-relaxed">{message}</p>
    </div>
  );
}