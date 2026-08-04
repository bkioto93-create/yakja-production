// مسیر فایل: src/app/[lang]/users/[id]/page.tsx
// تکمیل گذشته‌نگر تسک ۳ فاز ۰۶ — صفحه‌ی عمومیِ «پروفایل کاربر»: دقیقاً هم‌الگو با صفحه‌ی جزئیات
// آگهی (src/app/[lang]/listings/[id]/page.tsx)، اما بدون گالری تصویر یا دکمه‌ی تماس — چون
// شماره‌ی موبایل کاربر هرگز به‌صورت عمومی نمایش داده نمی‌شود.
//
// این صفحه دقیقاً همان شکافی را پر می‌کند که در یادداشت «محدودیت شفاف» تسک ۳ فاز ۰۶ ثبت شده بود:
// اکنون دکمه‌ی مشترک ReportButton با target_type='user' یک مقصد واقعی دارد.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** VipBadge کنار نام نمایشی، فقط اگر profile.isVip.
//
// **به‌روزرسانی فاز ۱۴ (قابلیت استوری):** آواتار این صفحه هم — دقیقاً مثل کارت هویت خودِ کاربر
// در src/app/[lang]/profile/ProfileClient.tsx — با UserStoryAvatar پیچیده شد؛ اگر profile.
// hasActiveStory باشد، حلقه‌ی هایلایت نمایش داده می‌شود و با کلیک، Viewer باز می‌شود.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicUserProfile } from "@/lib/users/publicProfileQueries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ReportButton } from "@/components/reports/ReportButton";
import { VipBadge } from "@/components/vip/VipBadge";
import { UserStoryAvatar } from "@/components/stories/UserStoryAvatar";

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const pageDict = dict.users.publicProfile;

  const [profile, viewer] = await Promise.all([getPublicUserProfile(id), getCurrentUser()]);

  if (!profile) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
        <Card className="p-6 flex flex-col items-center text-center gap-3 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{pageDict.notFoundTitle}</h2>
          <p className="text-sm text-text-muted">{pageDict.notFoundDesc}</p>
          <Link href={`/${lang}`} className="w-full">
            <Button variant="primary" fullWidth>
              {pageDict.backToHomeButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const displayName = profile.name?.trim() ? profile.name : pageDict.fallbackName;
  const isOwnProfile = viewer?.id === profile.id;

  return (
    <div className="flex flex-col gap-5 px-5 md:px-0 pt-8 pb-10 max-w-lg md:max-w-xl mx-auto w-full">
      <Link
        href={`/${lang}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted w-fit active:opacity-70"
      >
        <Icons.ArrowRight className="w-4 h-4" />
        {pageDict.backButton}
      </Link>

      {/* کارت هویت — دقیقاً هم‌الگو با کارت هویت حساب در src/app/[lang]/profile/ProfileClient.tsx،
          با یک تفاوت کلیدی: اینجا شماره‌ی موبایل هرگز نمایش داده نمی‌شود (حریم خصوصی). */}
      <Card className="p-5 flex items-center gap-4">
        <UserStoryAvatar
          userId={profile.id}
          ownerName={displayName}
          hasActiveStory={profile.hasActiveStory}
          isOwnStories={isOwnProfile}
          size={64}
          ariaLabel={dict.stories.ringAriaLabelTemplate.replace("{name}", displayName)}
          loadErrorMessage={dict.stories.loadErrorMessage}
          viewerDict={dict.stories.viewer}
        >
          <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icons.User className="w-8 h-8" />
            )}
          </div>
        </UserStoryAvatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-extrabold text-text-main truncate">{displayName}</h1>
            {profile.isVip && <VipBadge label={dict.vip.badgeLabel} />}
          </div>
          <p className="text-sm text-text-muted mt-0.5">
            {pageDict.memberSinceLabel.replace("{year}", String(profile.memberSinceYear))}
          </p>
        </div>
      </Card>

      {/* آمار عمومی — فقط تعداد آگهی‌های approved، بدون هیچ اطلاعات حساس دیگری. */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex flex-col items-center text-center gap-1">
          <Icons.Box className="w-5 h-5 text-primary" />
          <span className="text-lg font-extrabold text-text-main">{profile.listingsCount}</span>
          <span className="text-xs text-text-muted">{pageDict.listingsCountLabel}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center text-center gap-1">
          <Icons.PropertyHouseSale className="w-5 h-5 text-primary" />
          <span className="text-lg font-extrabold text-text-main">{profile.realEstateCount}</span>
          <span className="text-xs text-text-muted">{pageDict.realEstateCountLabel}</span>
        </Card>
      </div>

      {/* تکمیل گذشته‌نگر تسک ۳ فاز ۰۶ — دکمه‌ی «گزارش تخلف» روی پروفایل کاربر؛ target_type = user.
          برای خودِ کاربر مخفی می‌شود چون createReportAction هم‌اکنون درخواست گزارشِ خود را با
          خطای cannotReportSelf رد می‌کند — این فقط یک بهبود تجربه‌ی کاربری در همان راستاست. */}
      {!isOwnProfile && (
        <ReportButton
          lang={lang}
          targetType="user"
          targetId={profile.id}
          label={dict.reports.reportButtonLabel}
          className="self-center"
        />
      )}
    </div>
  );
}