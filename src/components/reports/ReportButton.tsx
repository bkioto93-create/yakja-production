// مسیر فایل: src/components/reports/ReportButton.tsx
// تسک ۳ فاز ۰۶ — دکمه‌ی مشترک «گزارش تخلف»، برای استفاده روی هر آگهی/پروفایل (کالا، حمل‌ونقل،
// خدمات، املاک). دقیقاً یک کامپوننت مشترک ساخته شد (نه تکرار در هر ماژول) چون منطق و ظاهر دکمه در
// همه‌جا یکسان است؛ فقط target_type/target_id فرق می‌کند — دقیقاً هم‌روح با تک‌نقطه‌ی حقیقتِ
// src/lib/reports/reportTargets.ts (تسک ۱ همین فاز).
//
// طراحی عمدی: برخلاف دکمه‌ی «تماس» (اصلی/primary/تمام‌عرض)، این دکمه یک لینک متنی کوچک با آیکون
// است — چون «گزارش تخلف» یک اقدام ثانویه و کم‌تکرار است، نه اقدام اصلی صفحه؛ وزن بصری پایین‌تر از
// دکمه‌ی تماس، اما همیشه در دسترس و قابل مشاهده.
//
// این دکمه صرفاً به مسیر src/app/[lang]/report/new هدایت می‌کند (با querystring مشخص‌کننده‌ی
// target_type/target_id)؛ ساخت واقعیِ فرم انتخاب دلیل گزارش، طبق برنامه، در تسک ۴ همین فاز انجام
// خواهد شد. تا تکمیل تسک ۴، آن مسیر فقط یک صفحه‌ی موقت/جای‌گیر (Placeholder) نمایش می‌دهد تا این
// لینک هرگز به یک صفحه‌ی ۴۰۴ ختم نشود.
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import type { ReportTargetType } from "@/lib/reports/reportTargets";

export function ReportButton({
  lang,
  targetType,
  targetId,
  label,
  className = "",
}: {
  lang: string;
  targetType: ReportTargetType;
  targetId: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={`/${lang}/report/new?type=${targetType}&id=${targetId}`}
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-text-muted active:opacity-70 w-fit ${className}`}
    >
      <Icons.Flag className="w-3.5 h-3.5 shrink-0" />
      {label}
    </Link>
  );
}