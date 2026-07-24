// مسیر فایل: src/app/[lang]/admin/listings/actions.ts
// تسک ۳ فاز ۰۷ — اکشن تغییر وضعیت (تایید/رد/حذف) یک آگهی کالا یا آگهی ملک. دقیقاً هم‌الگو با
// updateReportStatusAction (تسک ۴/۵، src/app/[lang]/admin/reports/actions.ts): یک اکشن مجزا و
// کوچک که فقط ستون status را تغییر می‌دهد؛ اما چون این تسک دو جدول متفاوت (listings/real_estate)
// را هم‌زمان پوشش می‌دهد، یک پارامتر «module» هم می‌گیرد تا جدول درست را هدف بگیرد — به‌جای
// نوشتن دو اکشن تقریباً یکسان و تکراری.
//
// **به‌روزرسانی تسک ۷ فاز ۰۷ («ثبت خودکار هر اقدام ادمین در admin_logs»):** پس از موفقیتِ خودِ
// تغییر status، یک ثبت در admin_logs اضافه شد. target_type بسته به module، «listing» یا
// «real_estate» است (نه یک مقدار ثابت «listing» برای هر دو) تا در فهرست لاگ‌ها بشود دو ماژول را
// از هم تشخیص داد؛ مقدار action همان status تازه است (pending/approved/deleted) — از طریق
// logAdminAction (src/lib/admin/adminLogs.ts)، دقیقاً طبق یادداشتی که همین فایل از تسک ۳ به‌جا
// مانده بود.
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { logAdminAction, type AdminLogTargetType } from "@/lib/admin/adminLogs";

export type ListingModule = "marketplace" | "realEstate";

const TABLE_BY_MODULE: Record<ListingModule, string> = {
  marketplace: "listings",
  realEstate: "real_estate",
};

const PUBLIC_PATH_BY_MODULE: Record<ListingModule, string> = {
  marketplace: "listings",
  realEstate: "real-estate",
};

// نگاشت module (نامِ سمت کد) به target_type لاگ (نامِ ستون دیتابیس) — عمداً از TABLE_BY_MODULE
// جدا نگه داشته شد چون آن یکی نام جدول را می‌دهد (listings/real_estate)، اما اینجا target_type
// دلخواهِ خودِ admin_logs مدنظر است (listing/real_estate، نه نام جدول listings با s).
const LOG_TARGET_BY_MODULE: Record<ListingModule, AdminLogTargetType> = {
  marketplace: "listing",
  realEstate: "real_estate",
};

export type ListingModerationStatus = "pending" | "approved" | "deleted";

const VALID_STATUSES: ListingModerationStatus[] = ["pending", "approved", "deleted"];
const VALID_MODULES: ListingModule[] = ["marketplace", "realEstate"];

type ActionResult = { success: true } | { success: false; error: string };

export async function setListingModerationStatusAction(
  lang: string,
  moduleName: ListingModule,
  id: string,
  status: ListingModerationStatus
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  if (!VALID_MODULES.includes(moduleName)) return { success: false, error: "invalidModule" };
  if (!VALID_STATUSES.includes(status)) return { success: false, error: "invalidStatus" };

  const table = TABLE_BY_MODULE[moduleName];

  const { error } = await supabaseAdminClient.from(table).update({ status }).eq("id", id);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: LOG_TARGET_BY_MODULE[moduleName],
    targetId: id,
    action: status,
  });

  revalidatePath(`/${lang}/admin/listings`);
  revalidatePath(`/${lang}/admin`);
  // صفحه‌ی عمومی جزئیات همان آگهی هم revalidate می‌شود چون تغییر وضعیت مستقیماً روی نمایش/عدم
  // نمایش آن برای کاربر مهمان (status='approved') اثر می‌گذارد.
  revalidatePath(`/${lang}/${PUBLIC_PATH_BY_MODULE[moduleName]}/${id}`);

  return { success: true };
}