// مسیر فایل: src/app/[lang]/admin/sms/page.tsx
// تسک ۵ فاز ۰۱ + بند ۸.۲/۸.۳ سند راهبردی — نمایش کدهای OTP اخیر برای تست داخلی توسط مدیر،
// تا زمانی‌که پنل پیامک واقعی خریداری و متصل شود.
// **به‌روزرسانی اصلاح UX موبایل:** جدول HTML شش‌ستونه (نیازمند اسکرول افقی روی گوشی) به فهرست
// کارتی عمودی تبدیل شد؛ هیچ کوئری یا داده‌ای تغییر نکرد.
import { getDictionary } from "@/dictionaries/getDictionary";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminSmsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const { data: codes } = await supabaseAdminClient
    .from("otp_codes")
    .select("id, phone_number, code, created_at, expires_at, is_used, attempts")
    .order("created_at", { ascending: false })
    .limit(50);

  const now = Date.now();
  const locale = lang === "ps" ? "ps-AF" : "fa-IR";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-text-main">{dict.admin.sms.title}</h1>

      <Card className="p-4 bg-accent/5 border-accent/20">
        <p className="text-sm text-text-main font-semibold">{dict.admin.sms.notice}</p>
      </Card>

      {(codes ?? []).length === 0 ? (
        <Card className="p-8 text-center text-text-muted text-sm">{dict.admin.sms.empty}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {(codes ?? []).map((row) => {
            const isExpired = new Date(row.expires_at).getTime() < now;
            const status = row.is_used
              ? dict.admin.sms.statusUsed
              : isExpired
              ? dict.admin.sms.statusExpired
              : dict.admin.sms.statusActive;
            const statusColor = row.is_used
              ? "text-slate-400"
              : isExpired
              ? "text-red-500"
              : "text-emerald-600";

            return (
              <Card key={row.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono font-bold text-text-main" dir="ltr">
                    {row.phone_number}
                  </span>
                  <span className={`font-bold text-sm whitespace-nowrap ${statusColor}`}>
                    {status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-bg-base rounded-xl px-3 py-2">
                  <span className="text-xs text-text-muted">{dict.admin.sms.colCode}</span>
                  <span className="font-mono font-extrabold tracking-widest text-lg text-primary" dir="ltr">
                    {row.code}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-text-muted">
                  <span>
                    {dict.admin.sms.colCreated}: {new Date(row.created_at).toLocaleString(locale)}
                  </span>
                  <span>
                    {dict.admin.sms.colExpires}: {new Date(row.expires_at).toLocaleString(locale)}
                  </span>
                  <span>
                    {dict.admin.sms.colAttempts}: {row.attempts}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
