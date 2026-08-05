// مسیر فایل: src/app/api/mobile/v1/vip/route.ts
// قابلیت VIP (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ داده‌ی لازم برای صفحه‌ی خرید/تمدید VIP:
// تنظیمات فعلی (قیمت ماهانه + اطلاعات بانک/صرافی) + آخرین درخواستِ خودِ کاربر (اگر داشته باشد).
//
// چرا از پل موبایل، نه Anon Key مستقیم: هم جدول platform_settings و هم جدول vip_requests هیچ
// Policy عمومی‌ای ندارند (این تنظیمات و درخواست‌های کاربران خصوصی/مدیریتی‌اند) — دقیقاً همان
// دلیلی که «تازه‌ترین راننده/متخصص» هم به پل موبایل نیاز داشتند. getVipSettings و
// getMyLatestVipRequest هر دو با supabaseAdminClient (Service Role) می‌خوانند.
//
// صفر منطق تجاری تازه — getVipSettings و getMyLatestVipRequest موجود (src/lib/vip/
// platformSettings.ts و src/lib/vip/vipQueries.ts) با هم صدا زده می‌شوند.
//
// **بدون نیاز به احراز هویت برای بخشِ settings** — دقیقاً مثل صفحه‌ی وب که حتی برای کاربر مهمان
// هم قیمت را نشان می‌دهد (پیش از رسیدن به کارتِ دعوت‌به‌ورود). latestRequest برای کاربر مهمان
// همیشه null است (بدون نیاز به بررسی جداگانه، چون getMyLatestVipRequest با یک userId خالی معنا
// ندارد).
//
// خروجی: { settings: VipSettings, latestRequest: MyVipRequest | null }
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getVipSettings } from "@/lib/vip/platformSettings";
import { getMyLatestVipRequest } from "@/lib/vip/vipQueries";

export async function GET() {
  const user = await getCurrentUser();

  const [settings, latestRequest] = await Promise.all([
    getVipSettings(),
    user ? getMyLatestVipRequest(user.id) : Promise.resolve(null),
  ]);

  return NextResponse.json({ settings, latestRequest });
}