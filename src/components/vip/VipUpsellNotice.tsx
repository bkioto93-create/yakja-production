// مسیر فایل: src/components/vip/VipUpsellNotice.tsx
// فاز ۱۱ — کامپوننت مشترک «دعوت به VIP» (بند ۶ پرامپت VIP). هرجا کاربر به یک قابلیت VIP-محور
// برخورد می‌کند (آپلود ویدئو در هر ۴ فرم، تلاش برای ثبت سومین آگهی در همان روز)، به‌جای مخفی/
// غیرفعال‌کردن ساده‌ی دکمه، همین یک کارت دوستانه یک‌بار نوشته و همه‌جا دوباره استفاده می‌شود —
// دقیقاً همان الگوی کارت‌های راهنما/خالی‌بودن موجود در پروژه (مثل کارت «موردی یافت نشد»).
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function VipUpsellNotice({
  lang,
  message,
  buttonLabel,
  className = "",
}: {
  lang: string;
  message: string;
  buttonLabel: string;
  className?: string;
}) {
  return (
    <Card
      className={`p-4 flex flex-col items-center text-center gap-2.5 bg-gradient-to-b from-amber-50 to-white border-amber-100 ${className}`}
    >
      <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center">
        <SparklesIcon className="w-6 h-6" />
      </div>
      <p className="text-sm font-bold text-text-main max-w-xs">{message}</p>
      <Link href={`/${lang}/vip`} className="w-full max-w-[220px]">
        <Button variant="primary" fullWidth className="!bg-amber-500 hover:!bg-amber-600">
          {buttonLabel}
        </Button>
      </Link>
    </Card>
  );
}