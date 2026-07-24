// مسیر فایل: src/app/[lang]/admin/layout.tsx
// پوسته‌ی حداقلی و موقت پنل مدیریت — پیش‌نیاز تسک ۵ فاز ۰۱ (نمایش کد OTP برای تست داخلی).
// نسخه‌ی کامل و نهایی پنل مدیریت (نویگیشن کامل، داشبورد آماری، مدیریت کاربران/آگهی/گزارش)
// طبق فاز ۰۷ ساخته می‌شود؛ این پوسته فقط دسترسی امن + بخش‌های موجود را فراهم می‌کند تا مدیر
// از همین حالا بتواند بدون معطلی تا پایان فاز ۰۷ کار کند.
// **به‌روزرسانی تسک ۳ فاز ۰۴:** لینک ناوبری «خدمات» (مدیریت تخصص‌های خدماتی) اضافه شد؛ همان
// الگوی لینک «پیامک‌ها»ی موجود، بدون هیچ تغییر ساختاری دیگر.
// **به‌روزرسانی تسک ۵ فاز ۰۶ (معادل تسک ۴ فاز ۰۷):** لینک ناوبری «گزارش‌ها» (صف بررسی گزارش‌های
// تخلف) اضافه شد؛ دقیقاً همان الگوی لینک «خدمات»، بدون هیچ تغییر ساختاری دیگر.
// **به‌روزرسانی تسک ۱ فاز ۰۷ (مسیر ورود مجزای ادمین):** پیش از این، بازدیدکننده‌ی بدون دسترسی به
// همان صفحه‌ی ورود عمومی OTP (`/auth/login`) هدایت می‌شد — یعنی حتی «مسیر ریدایرکت» هم با کاربر
// عادی مشترک بود. حالا به صفحه‌ی مستقل `/admin/login` (نام‌کاربری+رمزعبور) هدایت می‌شود. به‌علاوه،
// چون `requireAdmin` از این پس `authMethod==='password'` را هم الزامی می‌کند (نه فقط
// `role==='admin'`؛ رجوع کنید به src/lib/auth/session.ts)، یک کاربر که از طریق OTP عمومی وارد شده
// دیگر هرگز از این نقطه عبور نمی‌کند، حتی اگر ردیف او در جدول users نقش admin داشته باشد.
// **به‌روزرسانی تسک ۲ فاز ۰۷ (مدیریت کاربران):** لینک ناوبری «کاربران» اضافه شد؛ دقیقاً همان
// الگوی لینک‌های موجود، بدون هیچ تغییر ساختاری دیگر. عمداً بلافاصله بعد از «پیشخوان» قرار گرفت
// (نه در انتهای فهرست)، چون طبق بند ۶.۶ سند راهبردی، «مدیریت کاربران» اولین امکان ذکرشده‌ی پنل
// مدیریت است.
// **به‌روزرسانی تسک ۳ فاز ۰۷ (تایید/حذف آگهی‌ها):** لینک ناوبری «آگهی‌ها» اضافه شد؛ دقیقاً همان
// الگوی لینک‌های موجود، بدون هیچ تغییر ساختاری دیگر. عمداً بلافاصله بعد از «کاربران» قرار گرفت
// (نه در انتهای فهرست)، چون طبق بند ۶.۶ سند راهبردی، «تایید یا حذف آگهی‌ها» دومین امکان
// ذکرشده‌ی پنل مدیریت است (درست بعد از «مدیریت کاربران»).
// **به‌روزرسانی تسک ۵ فاز ۰۷ (مدیریت اختصاصی رانندگان و متخصصین فنی):** لینک ناوبری
// «رانندگان و متخصصین» اضافه شد. برخلاف لینک‌های «کاربران»/«آگهی‌ها» (که در جای مصوب‌شان طبق ترتیب
// بند ۶.۶ درج شدند)، این یکی عمداً در انتهای فهرست — بعد از «گزارش‌ها» — اضافه شد، دقیقاً هم‌رویه‌
// با «خدمات»/«گزارش‌ها»: چون همه‌ی امکانات پیش از آن (کاربران، آگهی‌ها) از قبل در جایگاه مصوبِ
// خودشان قرار داشتند، جابه‌جاکردنشان صرفاً برای هم‌ترازی عددی با شماره‌ی تسک، ریسکِ برخورد بی‌دلیل
// با تغییرات دیگر را بدون هیچ فایده‌ی کاربری واقعی اضافه می‌کرد.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { requireAdmin } from "@/lib/auth/session";
import { Icons } from "@/components/ui/Icons";
import { logoutAction } from "./actions";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const admin = await requireAdmin();

  if (!admin) {
    redirect(`/${lang}/admin/login`);
  }

  const dict = await getDictionary(lang);
  const boundLogout = logoutAction.bind(null, lang);

  return (
    <div className="flex flex-col min-h-[80vh] w-full px-4 md:px-0 py-6">
      <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-6 shadow-sm">
        <div className="flex items-center gap-5 flex-wrap">
          <Link
            href={`/${lang}/admin`}
            className="flex items-center gap-2 font-extrabold text-text-main"
          >
            <Icons.LayoutDashboard className="w-5 h-5 text-primary" />
            {dict.admin.nav.dashboard}
          </Link>
          <Link
            href={`/${lang}/admin/users`}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary"
          >
            <Icons.User className="w-5 h-5" />
            {dict.admin.nav.users}
          </Link>
          <Link
            href={`/${lang}/admin/listings`}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary"
          >
            <Icons.CheckCircle className="w-5 h-5" />
            {dict.admin.nav.listings}
          </Link>
          <Link
            href={`/${lang}/admin/sms`}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary"
          >
            <Icons.MessageSquare className="w-5 h-5" />
            {dict.admin.nav.sms}
          </Link>
          <Link
            href={`/${lang}/admin/services`}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary"
          >
            <Icons.Wrench className="w-5 h-5" />
            {dict.admin.nav.services}
          </Link>
          <Link
            href={`/${lang}/admin/reports`}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary"
          >
            <Icons.Flag className="w-5 h-5" />
            {dict.admin.nav.reports}
          </Link>
          <Link
            href={`/${lang}/admin/providers`}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary"
          >
            <Icons.Users className="w-5 h-5" />
            {dict.admin.nav.providers}
          </Link>
        </div>

        <form action={boundLogout}>
          <button type="submit" className="flex items-center gap-2 font-bold text-red-500 text-sm">
            <Icons.LogOut className="w-5 h-5" />
            {dict.admin.nav.logout}
          </button>
        </form>
      </div>

      {children}
    </div>
  );
}