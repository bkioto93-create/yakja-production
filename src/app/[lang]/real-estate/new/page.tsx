// مسیر فایل: src/app/[lang]/real-estate/new/page.tsx
// تسک ۴ فاز ۰۵ — صفحه‌ی ثبت آگهی جدید ملک. برای کاربر مهمان (بدون نشست)، به‌جای فرم، کارت دعوت به
// ورود نمایش داده می‌شود (دقیقاً همان الگوی src/app/[lang]/listings/new/page.tsx، فاز ۰۲، تسک ۴)،
// چون ثبت آگهی نیازمند owner_id واقعی است.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { NewRealEstateWizard } from "./NewRealEstateWizard";
import type { Locale } from "@/lib/i18n/constants";

export default async function NewRealEstatePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.User className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{dict.realEstate.wizard.loginRequiredTitle}</h2>
          <p className="text-sm text-text-muted">{dict.realEstate.wizard.loginRequiredDesc}</p>
          <Link href={`/${lang}/auth/login`} className="w-full">
            <Button variant="primary" fullWidth>
              {dict.realEstate.wizard.loginRequiredButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 md:px-0 py-6 max-w-lg md:max-w-xl mx-auto w-full gap-4">
      <h1 className="text-xl font-extrabold text-text-main">{dict.realEstate.wizard.title}</h1>
      <NewRealEstateWizard lang={lang as Locale} dict={dict} />
    </div>
  );
}