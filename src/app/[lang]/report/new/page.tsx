// مسیر فایل: src/app/[lang]/report/new/page.tsx
// تسک ۴ فاز ۰۶ — جایگزینِ کاملِ پوسته‌ی حداقلی تسک ۳ با فرم واقعیِ ثبت گزارش تخلف: انتخابگر
// دلیل (کلاهبرداری، محتوای نامناسب، آگهی جعلی، سایر) + فیلد توضیح آزاد اختیاری، متصل به
// Server Action ثبت گزارش (src/app/[lang]/report/new/actions.ts).
//
// type/id همچنان از querystring خوانده می‌شوند (همان الگوی تسک ۳)؛ اگر نامعتبر/ناقص بودند، پیام
// «درخواست نامعتبر» به‌جای فرم نمایش داده می‌شود — دقیقاً همان رفتار پوسته‌ی قبلی.
//
// تفاوت جدید نسبت به تسک ۳: چون ثبت گزارش نیازمند reporter_id واقعی است (دقیقاً هم‌الگو با
// src/app/[lang]/services/provider/page.tsx، فاز ۰۴)، برای کاربر مهمان (بدون نشست)، به‌جای فرم،
// کارت دعوت به ورود نمایش داده می‌شود.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidReportTargetType, type ReportTargetType } from "@/lib/reports/reportTargets";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { NewReportForm } from "./NewReportForm";

export default async function NewReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { lang } = await params;
  const { type, id } = await searchParams;
  const dict = await getDictionary(lang);
  const pageDict = dict.reports.newPage;

  const isValidTarget = !!type && !!id && isValidReportTargetType(type);

  return (
    <div className="flex flex-col gap-5 px-4 md:px-0 pt-6 pb-10 max-w-lg mx-auto w-full">
      <Link
        href={`/${lang}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted w-fit active:opacity-70"
      >
        <Icons.ArrowRight className="w-4 h-4" />
        {pageDict.backButton}
      </Link>

      {!isValidTarget ? (
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.Flag className="w-8 h-8" />
          </div>
          <h1 className="font-extrabold text-text-main">{pageDict.title}</h1>
          <p className="text-sm text-text-muted">{pageDict.invalidTargetDesc}</p>
          <Link href={`/${lang}`} className="w-full">
            <Button variant="outline" fullWidth>
              {pageDict.backButton}
            </Button>
          </Link>
        </Card>
      ) : (
        <ReportGate lang={lang} dict={dict} targetType={type as ReportTargetType} targetId={id as string} />
      )}
    </div>
  );
}

async function ReportGate({
  lang,
  dict,
  targetType,
  targetId,
}: {
  lang: string;
  dict: Awaited<ReturnType<typeof getDictionary>>;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const pageDict = dict.reports.newPage;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Card className="p-6 flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Icons.User className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-text-main">{pageDict.loginRequiredTitle}</h2>
        <p className="text-sm text-text-muted">{pageDict.loginRequiredDesc}</p>
        <Link href={`/${lang}/auth/login`} className="w-full">
          <Button variant="primary" fullWidth>
            {pageDict.loginRequiredButton}
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-text-main">{pageDict.title}</h1>
        <p className="text-sm text-text-muted">{pageDict.subtitle}</p>
      </div>
      <NewReportForm lang={lang} dict={dict} targetType={targetType} targetId={targetId} />
    </div>
  );
}