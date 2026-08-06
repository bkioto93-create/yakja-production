// مسیر فایل: src/app/[lang]/vip/page.tsx
// فاز ۱۱ — صفحه‌ی معرفی/خرید اشتراک VIP (بند ۲ پرامپت VIP). برای کاربر مهمان (بدون نشست)،
// دقیقاً هم‌الگو با src/app/[lang]/real-estate/new/page.tsx، به‌جای فرم یک کارت دعوت به ورود
// نمایش داده می‌شود — چون ثبت درخواست VIP نیازمند user_id واقعی است.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getVipSettings } from "@/lib/vip/platformSettings";
import { getMyLatestVipRequest } from "@/lib/vip/vipQueries";
import { isUserVip } from "@/lib/vip/vipStatus";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { VipPurchaseClient } from "./VipPurchaseClient";
import type { Locale } from "@/lib/i18n/constants";

export const dynamic = "force-dynamic";

export default async function VipPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const vipDict = dict.vip;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.User className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{vipDict.loginRequiredTitle}</h2>
          <p className="text-sm text-text-muted">{vipDict.loginRequiredDesc}</p>
          <Link href={`/${lang}/auth/login`} className="w-full">
            <Button variant="primary" fullWidth>
              {vipDict.loginRequiredButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const [settings, latestRequest] = await Promise.all([
    getVipSettings(),
    getMyLatestVipRequest(user.id),
  ]);

  const isVip = isUserVip(user.vipExpiresAt);

  return (
    <div className="flex flex-col px-4 md:px-0 py-6 max-w-lg md:max-w-xl mx-auto w-full gap-5">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-l from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
          <Icons.CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-extrabold text-text-main">{vipDict.pageTitle}</h1>
        <p className="text-sm text-text-muted max-w-sm">{vipDict.pageSubtitle}</p>
      </div>

      {/* سه امتیاز VIP — دقیقاً همان سه‌تا طبق بند ۱ پرامپت */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-main text-sm">{vipDict.benefits.videoTitle}</span>
            <span className="text-xs text-text-muted">{vipDict.benefits.videoDesc}</span>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.Box className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-main text-sm">{vipDict.benefits.postsTitle}</span>
            <span className="text-xs text-text-muted">{vipDict.benefits.postsDesc}</span>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-main text-sm">{vipDict.benefits.chatTitle}</span>
            <span className="text-xs text-text-muted">{vipDict.benefits.chatDesc}</span>
          </div>
        </Card>
      </div>

      {/* بخش ترغیبی «چرا VIP نتیجه‌ی بهتری می‌آورد؟» — طبق درخواست صریح کارفرما: توضیح این‌که
          عضویت VIP یعنی مشتری بیشتر، دیده‌شدن بیشتر و فروش سریع‌تر. عمداً هر سه مورد به همان
          امتیازهای واقعیِ بالا (آگهی/چت نامحدود، ویدئو، نشان VIP) وصل شده‌اند، نه یک وعده‌ی
          انتزاعی؛ به همین دلیل هیچ ادعای اضافه‌ای (مثل «اولویت در نتایج جستجو») که در کد واقعی
          پیاده‌سازی نشده، اینجا گفته نمی‌شود. */}
      <div className="rounded-[26px] border border-amber-100 bg-gradient-to-b from-amber-50/70 to-white p-4 md:p-5 flex flex-col gap-4">
        <h2 className="font-extrabold text-text-main text-sm text-center">
          {vipDict.pitch.title}
        </h2>

        <div className="flex flex-col gap-3">
          {vipDict.pitch.items.map((item, index) => {
            const PitchIcon = [Icons.Users, Icons.Search, Icons.CheckCircle][index] ?? Icons.CheckCircle;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <PitchIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-text-main text-sm">{item.title}</span>
                  <span className="text-xs text-text-muted leading-relaxed">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* یادآوریِ مخصوصِ بخش املاک — طبق درخواست صریح کارفرما. */}
        <div className="rounded-2xl bg-white border border-amber-100 p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icons.Home className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-main text-xs">
              {vipDict.pitch.realEstateNoteLabel}
            </span>
            <span className="text-xs text-text-muted leading-relaxed mt-0.5">
              {vipDict.pitch.realEstateNote}
            </span>
          </div>
        </div>
      </div>

      <Card className="p-5 flex flex-col items-center text-center gap-1 bg-gradient-to-b from-amber-50 to-white border-amber-100">
        <span className="text-xs font-bold text-text-muted">{vipDict.priceLabel}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-amber-500" dir="ltr">
            {settings.monthlyPrice.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-text-muted">{vipDict.currencyPerMonth}</span>
        </div>
      </Card>

      <VipPurchaseClient
        lang={lang as Locale}
        dict={dict}
        isVip={isVip}
        vipExpiresAt={user.vipExpiresAt}
        settings={settings}
        latestRequest={latestRequest}
      />
    </div>
  );
}