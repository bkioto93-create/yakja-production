// مسیر فایل: src/app/[lang]/admin/page.tsx
// **به‌روزرسانی تسک ۳ فاز ۰۷:** کارت «تایید آگهی‌ها» اضافه شد؛ دقیقاً هم‌الگو با کارت گزارش‌های
// تخلف (نشان تعداد در انتظار = مجموع آگهی‌های کالا + آگهی‌های ملکِ pending، چون یک صفحه‌ی واحد
// هر دو ماژول را پوشش می‌دهد). عمداً بلافاصله بعد از کارت «گزارش‌های تخلف» و پیش از کارت
// «پیامک‌ها» قرار گرفت — هم‌سو با ترتیب بند ۶.۶ سند راهبردی.
// **به‌روزرسانی تسک ۵ فاز ۰۷:** کارت «رانندگان و متخصصین» اضافه شد. برخلاف کارت‌های «آگهی‌ها»/
// «گزارش‌ها»، این یکی نشان تعداد در انتظار ندارد چون هیچ صف تاییدی وجود ندارد — رانندگان/متخصصین
// همان لحظه‌ی ثبت فعال می‌شوند؛ این کارت فقط یک درِ ورودی ساده به فهرست مدیریتی است، دقیقاً
// هم‌الگو با کارت بدون-نشان «پیامک‌ها». عمداً در انتهای فهرست کارت‌ها (بعد از «پیامک‌ها») اضافه
// شد — همان استدلال ترتیب‌گذاری که در کامنت بالای admin/layout.tsx برای همین تسک آمده.
// **به‌روزرسانی تسک ۶ فاز ۰۷ («داشبورد آماری پایه»):** یک بخش تازه، دقیقاً بالای فهرست کارت‌های
// ناوبری موجود و زیر پیام خوش‌آمدگویی، اضافه شد — طبق متن دقیق بند ۶.۶ سند راهبردی: «تعداد کل
// کاربران، تعداد آگهی به‌تفکیک دسته، تعداد رانندگان فعال، تعداد گزارش‌های در انتظار». سه رقم اول
// از تابع تازه‌ی `getAdminStats` (`src/lib/admin/adminStatsQueries.ts`) می‌آیند؛ رقم چهارم
// (گزارش‌های در انتظار) عمداً یک کوئری تازه نگرفت — همان `pendingReportsCount` که از تسک ۳ برای
// نشان کارت «گزارش‌های تخلف» در همین صفحه از قبل خوانده می‌شد، مستقیماً در بخش آماری هم بازاستفاده
// شد، تا یک درخواست تکراری و غیرضروری به دیتابیس اضافه نشود. سه کارت خلاصه (کاربران/رانندگان
// فعال/گزارش‌های در انتظار) به‌صورت یک ردیف افقی، و شمارش آگهی‌ها به‌تفکیک ۹ دسته‌ی موجود (طبق
// `LISTING_CATEGORIES`، فاز ۰۲) در یک کارت مجزا به‌صورت گرید کوچک با همان آیکون هر دسته نمایش داده
// می‌شود — هم‌سو با اصل طلایی «اولویت تصویر بر متن» (بند ۲ سند راهبردی).
// **به‌روزرسانی تسک ۸ فاز ۰۷ («دکمه‌ی اختصاصی تهیه بک‌آپ»، بند ۹.۴ سند راهبردی):** یک کارت تازه
// در انتهای فهرست کارت‌های ناوبری اضافه شد. برخلاف بقیه‌ی کارت‌ها (که با <Link> به یک صفحه‌ی
// درون‌اپ می‌روند)، این یکی یک <a> ساده با href مستقیم به Route Handler دانلود (بدون نیاز به
// جاوااسکریپت) است؛ کلیک روی آن بلافاصله دانلود فایل JSON بک‌آپ را با مرورگر آغاز می‌کند، بدون
// نیاز به یک صفحه‌ی میانی مجزا.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { getPendingReportsCount } from "@/lib/reports/adminReportQueries";
import { getPendingListingsCount } from "@/lib/marketplace/adminListingQueries";
import { getPendingRealEstateCount } from "@/lib/realEstate/adminRealEstateQueries";
import { getAdminStats } from "@/lib/admin/adminStatsQueries";
import { LISTING_CATEGORIES } from "@/lib/marketplace/categories";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const pendingReportsCount = await getPendingReportsCount();
  const [pendingListingsCount, pendingRealEstateCount, stats] = await Promise.all([
    getPendingListingsCount(),
    getPendingRealEstateCount(),
    getAdminStats(),
  ]);
  const pendingListingsTotal = pendingListingsCount + pendingRealEstateCount;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-muted text-sm">{dict.admin.dashboard.welcome}</p>

      <div>
        <h2 className="font-bold text-text-main mb-2">{dict.admin.dashboard.statsSectionTitle}</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 flex flex-col items-center text-center gap-1">
            <Icons.User className="w-6 h-6 text-primary" />
            <span className="text-xl font-extrabold text-text-main">{stats.totalUsersCount}</span>
            <span className="text-xs text-text-muted">{dict.admin.dashboard.statsTotalUsersLabel}</span>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center gap-1">
            <Icons.Truck className="w-6 h-6 text-primary" />
            <span className="text-xl font-extrabold text-text-main">{stats.activeDriversCount}</span>
            <span className="text-xs text-text-muted">
              {dict.admin.dashboard.statsActiveDriversLabel}
            </span>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center gap-1">
            <Icons.Flag className="w-6 h-6 text-primary" />
            <span className="text-xl font-extrabold text-text-main">{pendingReportsCount}</span>
            <span className="text-xs text-text-muted">
              {dict.admin.dashboard.statsPendingReportsLabel}
            </span>
          </Card>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="font-bold text-text-main mb-3">
          {dict.admin.dashboard.statsListingsByCategoryTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.listingsByCategory.map((item) => {
            const categoryDef = LISTING_CATEGORIES.find((cat) => cat.id === item.categoryId);
            if (!categoryDef) return null;
            const CategoryIcon = categoryDef.icon;
            return (
              <div key={item.categoryId} className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CategoryIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-text-main">{item.count}</div>
                  <div className="text-xs text-text-muted truncate">
                    {dict.marketplace.categories[categoryDef.dictKey]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Link href={`/${lang}/admin/listings`}>
        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-text-main">{dict.admin.dashboard.listingsCardTitle}</h2>
            <p className="text-sm text-text-muted">{dict.admin.dashboard.listingsCardDesc}</p>
          </div>
          {pendingListingsTotal > 0 && (
            <span className="shrink-0 text-xs font-bold text-white bg-red-500 rounded-full px-2 py-1">
              {dict.admin.dashboard.listingsPendingBadge.replace(
                "{count}",
                String(pendingListingsTotal)
              )}
            </span>
          )}
        </Card>
      </Link>

      <Link href={`/${lang}/admin/reports`}>
        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.Flag className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-text-main">{dict.admin.dashboard.reportsCardTitle}</h2>
            <p className="text-sm text-text-muted">{dict.admin.dashboard.reportsCardDesc}</p>
          </div>
          {pendingReportsCount > 0 && (
            <span className="shrink-0 text-xs font-bold text-white bg-red-500 rounded-full px-2 py-1">
              {dict.admin.dashboard.reportsPendingBadge.replace(
                "{count}",
                String(pendingReportsCount)
              )}
            </span>
          )}
        </Card>
      </Link>

      <Link href={`/${lang}/admin/sms`}>
        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-text-main">{dict.admin.dashboard.smsCardTitle}</h2>
            <p className="text-sm text-text-muted">{dict.admin.dashboard.smsCardDesc}</p>
          </div>
        </Card>
      </Link>

      <Link href={`/${lang}/admin/providers`}>
        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-text-main">{dict.admin.dashboard.providersCardTitle}</h2>
            <p className="text-sm text-text-muted">{dict.admin.dashboard.providersCardDesc}</p>
          </div>
        </Card>
      </Link>

      {/* تسک ۸ فاز ۰۷ — کارت «تهیه بک‌آپ»: <a> ساده با href مستقیم به Route Handler دانلود، نه
          <Link>، چون این کارت به یک صفحه‌ی درون‌اپ نمی‌رود؛ کلیک روی آن بلافاصله دانلود فایل JSON
          بک‌آپ را در مرورگر آغاز می‌کند. */}
      <a href="/api/admin/backup" download>
        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-text-main">{dict.admin.dashboard.backupCardTitle}</h2>
            <p className="text-sm text-text-muted">{dict.admin.dashboard.backupCardDesc}</p>
          </div>
        </Card>
      </a>
      {/* تسک ۷ فاز ۰۹ («تایید عملیاتی‌بودن دکمه‌ی تهیه بک‌آپ») — راهنمای ساده‌ی زیر کارت بک‌آپ.
          ادمین این پروژه لزوماً کاربر فنی نیست؛ به همین دلیل این متن عمداً خارج از خودِ کارت (نه
          داخل توضیح کوتاه بالای دکمه) و با فونت کوچک‌تر/رنگ کم‌رنگ‌تر آمده — یک راهنمای مرحله‌به‌مرحله،
          نه یک توضیح فنی. طبق الزام قطعی ۲ سند راهبردی (ممنوعیت هاردکد متن)، این متن هم مثل بقیه‌ی
          متون از دیکشنری خوانده می‌شود (کلید تازه‌ی dict.admin.dashboard.backupHelpText، در
          fa.ts/ps.ts اضافه شد). */}
      <p className="text-xs text-text-muted leading-6 px-1 -mt-2">
        {dict.admin.dashboard.backupHelpText}
      </p>
    </div>
  );
}