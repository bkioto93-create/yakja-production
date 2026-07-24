// مسیر فایل: src/app/[lang]/admin/login/page.tsx
// تسک ۱ فاز ۰۷ — صفحه‌ی مستقل ورود مدیر؛ عمداً خارج از پوسته‌ی src/app/[lang]/admin/layout.tsx
// (که requireAdmin را الزامی می‌کند) قرار دارد، چون در لحظه‌ی بازدید از این صفحه، ادمین هنوز وارد
// نشده — قرار دادن آن زیر layout باعث چرخه‌ی ریدایرکت می‌شد.
import { redirect } from "next/navigation";
import { getDictionary } from "@/dictionaries/getDictionary";
import { requireAdmin } from "@/lib/auth/session";
import { Icons } from "@/components/ui/Icons";
import { AdminLoginClient } from "./AdminLoginClient";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // اگر مدیر همین حالا هم با نشست معتبر (authMethod="password") وارد است، دوباره فرم ورود را
  // نبیند؛ مستقیم به پیشخوان برود.
  const admin = await requireAdmin();
  if (admin) {
    redirect(`/${lang}/admin`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Icons.Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-text-main mb-2">
            {dict.admin.login.title}
          </h1>
          <p className="text-sm text-text-muted">{dict.admin.login.subtitle}</p>
        </div>
        <AdminLoginClient lang={lang} dict={dict} />
      </div>
    </div>
  );
}