// مسیر فایل: src/app/[lang]/admin/services/page.tsx
// تسک ۳ فاز ۰۴ — صفحه‌ی سروری «مدیریت تخصص‌های خدماتی». دقیقاً هم‌الگو با
// src/app/[lang]/admin/sms/page.tsx (فاز ۰۱): خواندنِ سمت سرور + force-dynamic (چون فهرست
// تخصص‌ها بعد از هر افزودن/ویرایش/سوییچ باید بلافاصله تازه باشد، نه از کش صفحه).
// دسترسی ادمین (requireAdmin) از قبل توسط src/app/[lang]/admin/layout.tsx تضمین شده؛ این صفحه
// نیازی به بررسی دوباره ندارد.
import { getDictionary } from "@/dictionaries/getDictionary";
import { getAllServiceCategoriesForAdmin } from "@/lib/services/serviceCategories";
import { ServiceCategoriesManager } from "./ServiceCategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const categories = await getAllServiceCategoriesForAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-text-main">{dict.admin.services.title}</h1>
      <p className="text-sm text-text-muted">{dict.admin.services.subtitle}</p>

      <ServiceCategoriesManager dict={dict} initialCategories={categories} />
    </div>
  );
}