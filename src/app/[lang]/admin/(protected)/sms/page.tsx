// مسیر فایل: src/app/[lang]/admin/sms/page.tsx
// تسک ۵ فاز ۰۱ + بند ۸.۲/۸.۳ سند راهبردی — نمایش کدهای OTP اخیر برای تست داخلی توسط مدیر،
// تا زمانی‌که پنل پیامک واقعی خریداری و متصل شود.
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

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-base text-text-muted text-right">
                <th className="px-4 py-3 font-bold">{dict.admin.sms.colPhone}</th>
                <th className="px-4 py-3 font-bold">{dict.admin.sms.colCode}</th>
                <th className="px-4 py-3 font-bold">{dict.admin.sms.colCreated}</th>
                <th className="px-4 py-3 font-bold">{dict.admin.sms.colExpires}</th>
                <th className="px-4 py-3 font-bold">{dict.admin.sms.colAttempts}</th>
                <th className="px-4 py-3 font-bold">{dict.admin.sms.colStatus}</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono" dir="ltr">
                      {row.phone_number}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tracking-widest" dir="ltr">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(row.created_at).toLocaleString(locale)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(row.expires_at).toLocaleString(locale)}
                    </td>
                    <td className="px-4 py-3">{row.attempts}</td>
                    <td className={`px-4 py-3 font-bold ${statusColor}`}>{status}</td>
                  </tr>
                );
              })}

              {(codes ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    {dict.admin.sms.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}