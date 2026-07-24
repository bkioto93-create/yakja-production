// مسیر فایل: src/app/[lang]/admin/providers/actions.ts
// تسک ۵ فاز ۰۷ — اکشن‌های سوییچ فعال/غیرفعال «مدیریت اختصاصی رانندگان و متخصصین فنی». دقیقاً
// هم‌الگو با setUserBlockedAction (تسک ۲) و setServiceCategoryActiveAction (فاز ۰۴، تسک ۳): یک
// اکشن مجزا و کوچک برای هر ماژول، نه بخشی از فرم ویرایش کامل، چون فقط ستون is_active تغییر
// می‌کند. دو اکشن مجزا (نه یک اکشن یکپارچه با پارامتر module مثل setListingModerationStatusAction)
// عمداً نوشته شد چون دو جدول drivers/service_providers هیچ ساختار ستونی مشترکی ندارند و یکی‌کردن
// آن‌ها فقط پیچیدگی اضافه می‌کرد بدون کاهش واقعی تکرار کد.
//
// **به‌روزرسانی تسک ۷ فاز ۰۷ («ثبت خودکار هر اقدام ادمین در admin_logs»):** پس از موفقیتِ خودِ
// به‌روزرسانی is_active در هر دو اکشن، یک ثبت در admin_logs اضافه شد (target=driver یا
// target=service_provider، اقدام=activate/deactivate) — از طریق logAdminAction
// (src/lib/admin/adminLogs.ts)، دقیقاً طبق یادداشتی که همین فایل از تسک ۵ به‌جا مانده بود.
"use server";

import { requireAdmin } from "@/lib/auth/session";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/adminLogs";

type ActionResult = { success: true } | { success: false; error: string };

export async function setDriverActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { error } = await supabaseAdminClient
    .from("drivers")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "driver",
    targetId: id,
    action: isActive ? "activate" : "deactivate",
  });

  return { success: true };
}

export async function setServiceProviderActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "unauthorized" };

  const { error } = await supabaseAdminClient
    .from("service_providers")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: "dbError" };

  await logAdminAction({
    adminId: admin.id,
    targetType: "service_provider",
    targetId: id,
    action: isActive ? "activate" : "deactivate",
  });

  return { success: true };
}