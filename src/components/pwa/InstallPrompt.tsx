// مسیر فایل: src/components/pwa/InstallPrompt.tsx
// کامپوننت پیشنهاد «نصب یکجا روی صفحه‌ی اصلی گوشی» — کاری که سند راهبردی زیر عنوان «هویت بصری
// اپ‌گونه» می‌خواهد اما تا پیش از این تسک هیچ‌جای پروژه واقعاً پیاده نشده بود (مانیفست پویا،
// Service Worker و آیکون‌ها همه آماده بودند، اما هیچ UI‌ای رویداد نصب مرورگر را نمی‌گرفت یا به
// کاربر iOS راهنمایی نمی‌داد).
//
// دو مسیر کاملاً متفاوت طبق واقعیت پلتفرم‌ها:
// ۱) اندروید/کروم (و مرورگرهای مبتنی بر Chromium): مرورگر خودش، وقتی معیارهای «قابل‌نصب‌بودن» را
//    ببیند (مانیفست معتبر + Service Worker + سرو روی https)، رویداد `beforeinstallprompt` را
//    شلیک می‌کند. ما این رویداد را می‌گیریم، جلوی نمایش خودکار مرورگر را می‌گیریم
//    (`event.preventDefault()`)، و به‌جایش کارت خودمان (هم‌راستا با ظاهر بقیه‌ی اپ) را نشان
//    می‌دهیم؛ دکمه‌اش همان `deferredPrompt.prompt()` مرورگر را صدا می‌زند.
// ۲) آیفون/سافاری: هیچ رویداد `beforeinstallprompt`ای اصلاً وجود ندارد — تنها راه، راهنمایی دستی
//    «روی آیکون اشتراک‌گذاری بزن، بعد Add to Home Screen را انتخاب کن» است. این حالت فقط وقتی
//    فعال می‌شود که واقعاً سافاری باشد (نه کروم/فایرفاکس روی iOS، چون آن‌ها اصلاً این قابلیت را
//    ندارند و راهنمایی نادرست گمراه‌کننده بود).
//
// اگر اپ از قبل نصب شده باشد (`display-mode: standalone` یا `navigator.standalone` در سافاری)،
// این کامپوننت اصلاً چیزی رندر نمی‌کند. وضعیت «قبلاً رد شده» هم از سرور (کوکی
// yakja_pwa_install_dismissed، src/lib/pwaInstall/constants.ts) به‌عنوان prop اولیه می‌آید تا
// هیچ چشمک‌زدنی (نمایش لحظه‌ای و بلافاصله محو‌شدن) رخ ندهد.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { dismissPwaInstallAction } from "@/lib/pwaInstall/actions";
import { useAsyncClick } from "@/lib/hooks/useAsyncClick";

type PwaInstallDict = {
  installTitle: string;
  installMessage: string;
  installButton: string;
  iosTitle: string;
  iosMessage: string;
  iosShareStep: string;
  iosAddStep: string;
  laterButton: string;
  closeLabel: string;
};

// تایپ رسمی این رویداد هنوز در lib.dom.d.ts استاندارد تعریف نشده (فقط کروم/Chromium پیاده‌سازیش
// می‌کنند)؛ پس تایپ کمینه‌ی مورد نیاز خودمان را همین‌جا تعریف می‌کنیم.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// روی iOS، فقط خودِ سافاری قابلیت «Add to Home Screen» را دارد؛ کروم/فایرفاکس/ادج روی آیفون همه
// فقط پوسته‌ای از سافاری هستند اما این قابلیت را ندارند — بررسی UA برای جلوگیری از راهنمایی غلط.
function isRealIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
}

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function InstallPrompt({
  initiallyDismissed,
  dict,
}: {
  initiallyDismissed: boolean;
  dict: PwaInstallDict;
}) {
  const [mode, setMode] = useState<"none" | "android" | "ios">("none");
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (initiallyDismissed) return;
    if (isAlreadyInstalled()) return;

    function handleBeforeInstallPrompt(event: Event) {
      // جلوگیری از نمایش خودکار نوار پیش‌فرض مرورگر — ما همان لحظه یا کمی بعد، کارت خودمان را
      // با ظاهر یکدست با بقیه‌ی اپ نشان می‌دهیم.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode("android");
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // آیفون/سافاری: چون هیچ رویدادی برای این حالت وجود ندارد، بعد از یک تاخیر کوتاه (تا بار اول
    // صفحه شلوغ نشود) مستقیم راهنمای دستی را نشان می‌دهیم.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIosDevice() && isRealIosSafari()) {
      iosTimer = setTimeout(() => {
        setMode("ios");
        setVisible(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [initiallyDismissed]);

  const handleDismiss = useCallback(() => {
    // بستن فوری در سمت کاربر، ثبت کوکی در پس‌زمینه — دقیقاً هم‌الگو با DisclaimerModal.
    setVisible(false);
    void dismissPwaInstallAction();
  }, []);

  // useAsyncClick هم وضعیت لودینگ دکمه را مدیریت می‌کند (تا زمانی که کاربر در پنجره‌ی رسمی
  // مرورگر تصمیم بگیرد، دکمه اسپینر نشان می‌دهد و غیرفعال است)، هم جلوی زدن دوباره‌ی دکمه را
  // می‌گیرد — چون prompt() مرورگر را فقط می‌شود یک‌بار روی هر رویداد صدا زد.
  const { isLoading: isInstalling, run: handleInstallClick } = useAsyncClick(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    // اگر کاربر در همان پنجره‌ی رسمی مرورگر هم انصراف داد، دیگر تا ۳۰ روز دوباره مزاحمش نمی‌شویم.
    if (choice.outcome !== "accepted") {
      void dismissPwaInstallAction();
    }
  });

  if (!visible || mode === "none") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] flex justify-center px-4 pb-[calc(var(--bottom-nav-content-height)+env(safe-area-inset-bottom,0px)+0.75rem)] md:pb-6 pointer-events-none animate-fade-in">
      <div className="pointer-events-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 w-full sm:max-w-md flex flex-col gap-3 relative">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={dict.closeLabel}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 active:scale-90 transition-all"
        >
          <Icons.X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pl-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.Download className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-text-main text-sm leading-snug">
              {mode === "ios" ? dict.iosTitle : dict.installTitle}
            </h2>
            <p className="text-xs text-text-muted leading-relaxed mt-1">
              {mode === "ios" ? dict.iosMessage : dict.installMessage}
            </p>
          </div>
        </div>

        {mode === "ios" ? (
          <div className="flex flex-col gap-2 bg-slate-50 rounded-2xl p-3 text-xs font-semibold text-text-muted">
            <div className="flex items-center gap-2">
              <Icons.Upload className="w-4 h-4 text-primary shrink-0" />
              <span>{dict.iosShareStep}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Plus className="w-4 h-4 text-primary shrink-0" />
              <span>{dict.iosAddStep}</span>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            fullWidth
            onClick={handleInstallClick}
            loading={isInstalling}
            loadingLabel={dict.installButton}
          >
            {dict.installButton}
          </Button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs font-semibold text-slate-400 hover:text-slate-500 self-center active:scale-95 transition-transform"
        >
          {dict.laterButton}
        </button>
      </div>
    </div>
  );
}
