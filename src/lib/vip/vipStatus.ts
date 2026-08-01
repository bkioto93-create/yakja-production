// مسیر فایل: src/lib/vip/vipStatus.ts
// فاز ۱۱ — تک‌نقطه‌ی حقیقت محاسبه‌ی «آیا این کاربر الان VIP فعال است؟» در سمت TypeScript.
//
// طبق تاکید صریح YAKJA_VIP_MEMBERSHIP_PROMPT.md (بخش ۳): هرگز یک boolean ساده‌ی is_vip که
// جداگانه به‌روز می‌شود ساخته نشد، چون بدون یک cron همیشه‌بیدار (که در Vercel/سرورلس به‌سختی
// قابل‌اعتماد است) آن boolean به‌مرور با واقعیت ناهم‌خوان می‌شود. به‌جایش همه‌جا از همین یک تابع
// ساده استفاده می‌شود: `vip_expires_at is not null and vip_expires_at > now()`.
//
// این دقیقاً همان منطقی است که در سمت Postgres هم به‌صورت مستقل در تابع public.is_vip_active(...)
// (رجوع کنید به 22_phase_11_vip_membership.sql) پیاده‌سازی شده — دو پیاده‌سازی موازی و هم‌معنا،
// چون یکی داخل کوئری‌های SQL (برای owner_is_vip در فهرست/جستجو) لازم است و دیگری داخل کد
// TypeScript (برای خودِ کاربر نشست‌دار، مثل صفحه‌ی پروفایل یا گیت‌کردن آپلود ویدئو).
//
// عمداً بدون هیچ وابستگی به Supabase یا "server-only" نوشته شده تا هم در Server Component/Action
// و هم (در آینده، طبق بند ۱۰ پرامپت) در لایه‌ی API موبایل بدون مشکل قابل‌استفاده باشد.

export function isUserVip(vipExpiresAt: string | null | undefined): boolean {
  if (!vipExpiresAt) return false;
  return new Date(vipExpiresAt).getTime() > Date.now();
}

// شکل ساده‌شده‌ی وضعیت VIP برای نمایش در UI (پروفایل، بنر، badge و ...) — یک‌جا محاسبه می‌شود
// تا کامپوننت‌های مصرف‌کننده مجبور به تکرار منطق تاریخ نباشند.
export type VipDisplayStatus = {
  isVip: boolean;
  expiresAt: string | null;
};

export function getVipDisplayStatus(vipExpiresAt: string | null | undefined): VipDisplayStatus {
  return {
    isVip: isUserVip(vipExpiresAt),
    expiresAt: vipExpiresAt ?? null,
  };
}