// مسیر فایل: src/lib/reports/adminReportQueries.ts
// تسک ۵ فاز ۰۶ (معادل تسک ۴ فاز ۰۷) — لایه‌ی خواندن «صف بررسی گزارش‌های تخلف» در پنل مدیریت.
//
// چون reports.target_id چندریختی است (اشاره به یکی از ۵ جدول مختلف بسته به target_type) و هیچ
// FK واقعی روی آن تعریف نشده (طبق طراحی عمدی تسک ۱ فاز ۰۶)، این فایل نمی‌تواند با یک join ساده‌ی
// SQL برچسب هر هدف را بخواند. راهکار: ابتدا ردیف‌های reports با وضعیت درخواستی خوانده می‌شوند،
// سپس target_idهای هر گروه (بر اساس target_type) در یک کوئری batched جدا (`.in("id", [...])`) از
// جدول متناظرش خوانده می‌شود و در حافظه با ردیف‌های reports ترکیب می‌شود.
//
// service_provider مورد خاص است: خودش برچسب مستقیم ندارد، پس نام تخصص (service_categories.name_fa)
// از طریق یک کوئری batched دوم خوانده می‌شود.
//
// عمداً بدون ترجمه‌ی مقادیر خام (مثل vehicle_type='taxi') — طبق الزام قطعی ۲، ترجمه‌ی نهایی برچسب
// در کامپوننت مصرف‌کننده (ReportsQueueTable.tsx) با dict انجام می‌شود، نه اینجا.
//
// اگر ردیف هدف دیگر وجود نداشت (مثلاً آگهی حذف/رد شده)، targetLabel برابر null برمی‌گردد؛ گزارش
// هرگز از صف حذف نمی‌شود، چون رسیدگی به آن حتی با هدف حذف‌شده هم معنا دارد.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import type { ReportReason } from "./reasons";
import type { ReportTargetType } from "./reportTargets";

export type ReportStatus = "pending" | "reviewed" | "resolved";

export type AdminReportRow = {
  id: string;
  reporterId: string | null;
  reporterName: string | null;
  reporterPhone: string | null;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string | null; // null یعنی ردیف هدف دیگر در دیتابیس وجود ندارد
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
};

type RawReportRow = {
  id: string;
  reporter_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
};

const TARGET_TABLE: Record<ReportTargetType, string> = {
  listing: "listings",
  driver: "drivers",
  service_provider: "service_providers",
  real_estate: "real_estate",
  user: "users",
};

// ستونی که به‌عنوان برچسب خام هر نوع هدف خوانده می‌شود (بجز service_provider که مسیر جدا دارد).
const TARGET_LABEL_COLUMN: Partial<Record<ReportTargetType, string>> = {
  listing: "title",
  driver: "vehicle_type",
  real_estate: "address",
  user: "name",
};

async function fetchLabelsForType(
  targetType: ReportTargetType,
  ids: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  if (targetType === "service_provider") {
    const { data: providers } = await supabaseAdminClient
      .from("service_providers")
      .select("id, service_category_id")
      .in("id", ids);

    if (!providers || providers.length === 0) return map;

    const categoryIds = Array.from(new Set(providers.map((p) => p.service_category_id)));
    const { data: categories } = await supabaseAdminClient
      .from("service_categories")
      .select("id, name_fa")
      .in("id", categoryIds);

    const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name_fa as string]));

    for (const p of providers) {
      const name = categoryNameById.get(p.service_category_id);
      if (name) map.set(p.id as string, name);
    }
    return map;
  }

  const table = TARGET_TABLE[targetType];
  const column = TARGET_LABEL_COLUMN[targetType]!;
  // نکته‌ی رفع خطای TypeScript: چون `column` یک متغیر رشته‌ای است (نه literal ثابت)، پارسر
  // نوع‌های supabase-js نمی‌تواند رشته‌ی `select(...)` را در زمان کامپایل تحلیل کند و بدون
  // `.returns<...>()` صریح، نوع `data` را به یک نوع خطا (ParserError) تبدیل می‌کند. `.returns<...>()`
  // شکل واقعی ردیف را صریحاً به TypeScript اعلام می‌کند و این مشکل را برطرف می‌کند.
  const { data } = await supabaseAdminClient
    .from(table)
    .select(`id, ${column}`)
    .in("id", ids)
    .returns<Array<Record<string, unknown>>>();

  for (const row of data ?? []) {
    const raw = row[column];
    if (typeof raw === "string" && raw.trim()) map.set(row.id as string, raw);
  }
  return map;
}

// صف بررسی گزارش‌ها برای یک وضعیت مشخص (تب فعال در پنل مدیریت)، جدیدترین‌ها اول.
export async function getReportsQueue(status: ReportStatus): Promise<AdminReportRow[]> {
  const { data, error } = await supabaseAdminClient
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, description, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as RawReportRow[];

  const idsByType = new Map<ReportTargetType, Set<string>>();
  const reporterIds = new Set<string>();
  for (const row of rows) {
    if (!idsByType.has(row.target_type)) idsByType.set(row.target_type, new Set());
    idsByType.get(row.target_type)!.add(row.target_id);
    if (row.reporter_id) reporterIds.add(row.reporter_id);
  }

  const labelMaps = new Map<ReportTargetType, Map<string, string>>();
  await Promise.all(
    Array.from(idsByType.entries()).map(async ([type, ids]) => {
      labelMaps.set(type, await fetchLabelsForType(type, Array.from(ids)));
    })
  );

  const { data: reportersData } = reporterIds.size
    ? await supabaseAdminClient
        .from("users")
        .select("id, name, phone_number")
        .in("id", Array.from(reporterIds))
    : { data: [] as { id: string; name: string | null; phone_number: string }[] };

  const reporterById = new Map((reportersData ?? []).map((u) => [u.id, u]));

  return rows.map((row) => {
    const reporter = row.reporter_id ? reporterById.get(row.reporter_id) : undefined;
    return {
      id: row.id,
      reporterId: row.reporter_id,
      reporterName: reporter?.name ?? null,
      reporterPhone: reporter?.phone_number ?? null,
      targetType: row.target_type,
      targetId: row.target_id,
      targetLabel: labelMaps.get(row.target_type)?.get(row.target_id) ?? null,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

// شمارش سبک (بدون خواندن ردیف‌ها) گزارش‌های «در انتظار» — برای نشان (Badge) کارت داشبورد ادمین.
export async function getPendingReportsCount(): Promise<number> {
  const { count } = await supabaseAdminClient
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return count ?? 0;
}