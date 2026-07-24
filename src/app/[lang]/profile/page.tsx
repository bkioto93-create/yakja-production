// مسیر فایل: src/app/[lang]/profile/page.tsx
// تسک ۸ فاز ۰۱ — صفحه‌ی «تنظیمات پروفایل». برخلاف /admin (که با redirect کاربر غیرمجاز را
// می‌راند)، این صفحه برای کاربر مهمان هم باز می‌ماند (فقط با یک کارت دعوت به ورود)، چون گشت‌وگذار
// در پلتفرم بدون ورود هم مجاز است (بند ۱۰ سند راهبردی) و لینک «من» در BottomNav/DesktopHeader
// همیشه در دسترس است.
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
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

  return <ProfileClient lang={lang as Locale} dict={dict} user={user} />;
}