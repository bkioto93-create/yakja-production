// مسیر فایل: src/app/[lang]/profile/ProfileClient.tsx
// تسک ۸ فاز ۰۱ — بخش تعاملی صفحه‌ی «تنظیمات پروفایل».
// برای کاربر مهمان (بدون نشست): کارت دعوت به ورود + سوییچ زبان (زبان بدون نیاز به ورود قابل تغییر است).
// برای کاربر واردشده: اطلاعات پایه‌ی حساب + نشان مدیر (در صورت role='admin') + سوییچ زبان + خروج.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** یک کارت وضعیت VIP اضافه شد — طبق بند ۵ پرامپت VIP
// («پروفایل خود کاربر در اپ»): اگر VIP فعال است، تیک VipBadge کنار شماره تماس + تاریخ انقضا؛
// اگر یک درخواست «در انتظار بررسی» یا «ردشده» دارد، همان وضعیت نشان داده می‌شود؛ در غیر این
// صورت، یک دعوت ساده به صفحه‌ی /vip.
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { VipBadge } from "@/components/vip/VipBadge";
import { switchLanguageAction, logoutAction } from "./actions";
import { isUserVip } from "@/lib/vip/vipStatus";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";
import type { SessionUser } from "@/lib/auth/session";
import type { MyVipRequest } from "@/lib/vip/vipQueries";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

export function ProfileClient({
  lang,
  dict,
  user,
  latestVipRequest,
}: {
  lang: Locale;
  dict: Dict;
  user: SessionUser | null;
  latestVipRequest: MyVipRequest | null;
}) {
  const [pendingLang, setPendingLang] = useState<Locale | null>(null);
  const [isSwitchingLang, startSwitchingLang] = useTransition();
  const [isLoggingOut, startLoggingOut] = useTransition();

  const vipDict = dict.vip;
  const isVip = user ? isUserVip(user.vipExpiresAt) : false;

  const handleSwitchLanguage = (nextLang: Locale) => {
    if (nextLang === lang || isSwitchingLang) return;
    setPendingLang(nextLang);
    startSwitchingLang(async () => {
      await switchLanguageAction(nextLang);
    });
  };

  const handleLogout = () => {
    startLoggingOut(async () => {
      await logoutAction(lang);
    });
  };

  return (
    <div className="flex flex-col gap-5 px-5 md:px-0 pt-8 pb-10 max-w-lg md:max-w-xl mx-auto w-full">
      <h1 className="text-2xl font-extrabold text-text-main">{dict.profile.title}</h1>

      {/* کارت هویت حساب — یا اطلاعات کاربر واردشده، یا دعوت به ورود برای مهمان */}
      {user ? (
        <Card className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.User className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold text-text-muted mb-0.5">
              {dict.profile.phoneLabel}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p dir="ltr" className="text-lg font-bold text-text-main truncate">
                {user.phoneNumber}
              </p>
              {isVip && <VipBadge label={vipDict.badgeLabel} />}
            </div>
            {user.role === "admin" && (
              <span className="inline-block mt-1.5 text-xs font-bold text-accent bg-accent/10 rounded-full px-2.5 py-1">
                {dict.profile.roleAdmin}
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Icons.User className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-text-main">{dict.profile.guestTitle}</h2>
          <p className="text-sm text-text-muted">{dict.profile.guestDesc}</p>
          <Link href={`/${lang}/auth/login`} className="w-full">
            <Button variant="primary" fullWidth>
              {dict.profile.loginButton}
            </Button>
          </Link>
        </Card>
      )}

      {/* فاز ۱۱ — کارت وضعیت VIP، فقط برای کاربر واردشده. */}
      {user && (
        <Link
          href={`/${lang}/vip`}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-l from-amber-50 to-white border border-amber-100 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
            <Icons.CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="font-bold text-text-main text-sm">
              {isVip && user.vipExpiresAt
                ? vipDict.form.currentlyVipUntil.replace(
                    "{date}",
                    new Date(user.vipExpiresAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")
                  )
                : latestVipRequest?.status === "pending"
                  ? vipDict.form.pendingTitle
                  : latestVipRequest?.status === "rejected"
                    ? vipDict.form.rejectedNotice
                    : vipDict.profileUpsellTitle}
            </span>
            {!isVip && !latestVipRequest && (
              <span className="text-xs text-text-muted">{vipDict.profileUpsellDesc}</span>
            )}
          </div>
          <Icons.ArrowRight className="w-4 h-4 text-text-muted rotate-180 shrink-0" />
        </Link>
      )}

      {/* فاز ۱۲ — لینک «چت‌های من»، فقط برای کاربر واردشده. */}
      {user && (
        <Link
          href={`/${lang}/chat`}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.MessageSquare className="w-5 h-5" />
          </div>
          <span className="flex-1 font-bold text-text-main">{dict.chat.myChatsLink}</span>
          <Icons.ArrowRight className="w-4 h-4 text-text-muted rotate-180 shrink-0" />
        </Link>
      )}

      {/* سوییچ زبان — تسک ۸ فاز ۰۱، در دسترس هم برای کاربر واردشده و هم مهمان */}
      <Card className="p-5 flex flex-col gap-3">
        <div>
          <h2 className="font-extrabold text-text-main">{dict.profile.languageTitle}</h2>
          <p className="text-sm text-text-muted mt-0.5">{dict.profile.languageDesc}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={lang === "fa" ? "primary" : "outline"}
            fullWidth
            disabled={isSwitchingLang}
            loading={isSwitchingLang && pendingLang === "fa"}
            onClick={() => handleSwitchLanguage("fa")}
          >
            {dict.profile.languageFa}
          </Button>
          <Button
            variant={lang === "ps" ? "primary" : "outline"}
            fullWidth
            disabled={isSwitchingLang}
            loading={isSwitchingLang && pendingLang === "ps"}
            onClick={() => handleSwitchLanguage("ps")}
          >
            {dict.profile.languagePs}
          </Button>
        </div>
      </Card>

      {/* دسترسی سریع به پنل مدیریت — فقط برای role='admin' */}
      {user?.role === "admin" && (
        <Link
          href={`/${lang}/admin`}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-bold text-text-main">{dict.profile.adminPanelLink}</span>
        </Link>
      )}

      {/* لینک تماس با پشتیبانی — همان کلید دیکشنری فوتر، بدون تکرار متن ترجمه */}
      <Link
        href={`/${lang}/contact`}
        className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 text-text-muted flex items-center justify-center">
          <Icons.MessageSquare className="w-5 h-5" />
        </div>
        <span className="font-bold text-text-main">{dict.footer.contact}</span>
      </Link>

      {user && (
        <Button
          variant="outline"
          fullWidth
          loading={isLoggingOut}
          disabled={isLoggingOut}
          onClick={handleLogout}
          className="!border-red-200 !text-red-500 hover:!bg-red-50 mt-2"
        >
          <Icons.LogOut className="w-5 h-5 ml-2" />
          {dict.profile.logout}
        </Button>
      )}
    </div>
  );
}