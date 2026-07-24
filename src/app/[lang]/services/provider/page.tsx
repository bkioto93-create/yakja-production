// مسیر فایل: src/app/[lang]/services/provider/page.tsx
// تسک ۶ فاز ۰۴ — صفحه‌ی ثبت/ویرایش پروفایل متخصص. دقیقاً هم‌الگو با
// src/app/[lang]/transport/driver/page.tsx (فاز ۰۳، تسک ۴): برای کاربر مهمان (بدون نشست)، به‌جای
// فرم، کارت دعوت به ورود نمایش داده می‌شود چون ثبت پروفایل متخصص نیازمند owner_id واقعی است. اگر
// کاربر قبلاً پروفایل متخصص داشته باشد (existingProfile غیر null)، همان فرم با مقادیر فعلی پر
// می‌شود و در «حالت ویرایش» نمایش داده می‌شود.
//
// برخلاف driver/page.tsx، اینجا فهرست تخصص‌های «فعال» (categories) هم از دیتابیس خوانده و به
// کلاینت فرستاده می‌شود — چون طبق یادداشت مصوب بالای YAKJA_PHASE_04_SERVICES.md، برخلاف نوع
// وسیله‌ی راننده (لیست ثابت در کد، VEHICLE_TYPES)، تخصص‌های خدماتی پویا و از جدول
// service_categories خوانده می‌شوند.
//
// این صفحه عمداً هنوز از هیچ صفحه‌ی دیگری (مثلاً یک دکمه‌ی «من متخصصم» در فهرست عمومی خدمات) لینک
// نشده، چون صفحه‌ی فهرست/جستجوی عمومی خدمات (src/app/[lang]/services/page.tsx) هنوز ساخته نشده —
// دقیقاً هم‌الگو با فاز ۰۳ که در آن هم driver/page.tsx (تسک ۴) پیش از transport/page.tsx با دکمه‌ی
// becomeDriverButton (تسک ۸) ساخته شد. آن اتصال، طبق ترتیب دقیق لیست تسک‌ها، در تسک ۷ همین فاز
// اضافه خواهد شد.
import Link from "next/link";
import { getDictionary } from "@/dictionaries/getDictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyServiceProviderProfile } from "@/lib/services/serviceProviderQueries";
import { getActiveServiceCategories } from "@/lib/services/serviceCategories";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { ServiceProviderProfileClient } from "./ServiceProviderProfileClient";

export default async function ServiceProviderProfilePage({
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
          <h2 className="font-extrabold text-text-main">
            {dict.services.providerProfile.loginRequiredTitle}
          </h2>
          <p className="text-sm text-text-muted">{dict.services.providerProfile.loginRequiredDesc}</p>
          <Link href={`/${lang}/auth/login`} className="w-full">
            <Button variant="primary" fullWidth>
              {dict.services.providerProfile.loginRequiredButton}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const [existingProfile, categories] = await Promise.all([
    getMyServiceProviderProfile(user.id),
    getActiveServiceCategories(),
  ]);

  return (
    <div className="flex flex-col px-4 md:px-0 py-6 max-w-lg md:max-w-xl mx-auto w-full gap-4">
      <h1 className="text-xl font-extrabold text-text-main">{dict.services.providerProfile.title}</h1>
      <p className="text-sm text-text-muted -mt-2">{dict.services.providerProfile.subtitle}</p>
      <ServiceProviderProfileClient
        dict={dict}
        lang={lang}
        defaultContactPhone={user.phoneNumber}
        existingProfile={existingProfile}
        categories={categories}
      />
    </div>
  );
}