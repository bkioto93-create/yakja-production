// مسیر فایل: src/app/[lang]/profile/page.tsx
// تسک ۸ فاز ۰۱ — صفحه‌ی «تنظیمات پروفایل». برخلاف /admin (که با redirect کاربر غیرمجاز را
// می‌راند)، این صفحه برای کاربر مهمان هم باز می‌ماند (فقط با یک کارت دعوت به ورود)، چون گشت‌وگذار
// در پلتفرم بدون ورود هم مجاز است (بند ۱۰ سند راهبردی) و لینک «من» در BottomNav/DesktopHeader
// همیشه در دسترس است.
//
// **به‌روزرسانی فاز ۱۱ (عضویت VIP):** آخرین درخواست VIP کاربر (در صورت وجود نشست) خوانده و به
// ProfileClient پاس داده می‌شود — برای نمایش نشان وضعیت (در انتظار/ردشده) کنار کارت VIP، طبق بند
// ۲ پرامپت VIP (مرحله‌ی ۵ جریان خرید).
//
// **به‌روزرسانی فاز ۱۴ (قابلیت استوری):** دو مقدار تازه برای کارت «افزودن استوری» خوانده می‌شود:
// تعداد استوری‌های امروزِ کاربر (برای نمایش «هنوز X از ۱ استوری رایگان مانده») و دسته‌ی کامل
// استوری‌های فعال خودش (برای این‌که کارت هویت حساب هم — دقیقاً مثل اینستاگرام — حلقه‌ی هایلایت
// دور آواتار خودش را نشان بدهد و بشود روی آن کلیک کرد).
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyLatestVipRequest } from "@/lib/vip/vipQueries";
import { getUserDailyStoryCount, FREE_DAILY_STORY_LIMIT } from "@/lib/stories/storyLimits";
import { hasActiveStory } from "@/lib/stories/storyQueries";
import { ProfileClient } from "./ProfileClient";
import type { Locale } from "@/lib/i18n/constants";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const user = await getCurrentUser();
  const latestVipRequest = user ? await getMyLatestVipRequest(user.id) : null;

  // هر دو کوئری استوری فقط برای کاربر واردشده لازم است؛ برای مهمان بدون کوئری اضافه صفر/false
  // در نظر گرفته می‌شود.
  const [dailyStoryCount, ownHasActiveStory] = user
    ? await Promise.all([getUserDailyStoryCount(user.id), hasActiveStory(user.id)])
    : [0, false];

  return (
    <ProfileClient
      lang={lang as Locale}
      dict={dict}
      user={user}
      latestVipRequest={latestVipRequest}
      dailyStoryCount={dailyStoryCount}
      dailyStoryLimit={FREE_DAILY_STORY_LIMIT}
      ownHasActiveStory={ownHasActiveStory}
    />
  );
}