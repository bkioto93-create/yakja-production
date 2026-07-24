// مسیر فایل: src/lib/services/serviceCategoryIcons.ts
// تسک ۳ فاز ۰۴ — کتابخانه‌ی آیکون‌های «آماده» (builtin) برای جدول پویای service_categories.
// برخلاف categories.ts (فاز ۰۲) و vehicleTypes.ts (فاز ۰۳) که تک‌نقطه‌ی حقیقتِ *کامل* دسته‌بندی
// (شناسه + آیکون) بودند، این فایل فقط نگاشت «آیکون» را نگه می‌دارد؛ چون طبق یادداشت مصوب بالای
// YAKJA_PHASE_04_SERVICES.md، خودِ فهرست تخصص‌ها (نام‌ها) دیگر در کد نیست و از دیتابیس خوانده
// می‌شود. مقدار هر `key` دقیقاً همان چیزی است که در ستون service_categories.icon_key ذخیره
// می‌شود (برای ۱۰ تخصص پایه، طبق 10_phase_04_service_categories_schema.sql).
//
// «ServiceOther» عمداً به Icons.CategoryOther نگاشت شده، نه یک SVG تازه — دقیقاً هم‌الگو با
// تصمیم مشابه در src/lib/transport/vehicleTypes.ts (نمادِ «سایر» در کل اپ یکدست بماند).
// چهار آیکون آخر (Wrench/User/Box/Truck) تخصص‌محور نیستند؛ صرفاً به‌عنوان انتخاب‌های عمومیِ
// اضافه در کتابخانه گنجانده شدند تا وقتی ادمین بعداً یک تخصص کاملاً تازه (خارج از ۱۰ مورد پایه)
// اضافه می‌کند و هیچ‌کدام از ۹ آیکون تخصصی مناسب آن نبود، راهی غیر از «آپلود سفارشی» هم داشته
// باشد — دقیقاً طبق متن تسک ۳: «انتخاب از کتابخانه یا آپلود سفارشی».
import { Icons } from "@/components/ui/Icons";

export const SERVICE_CATEGORY_BUILTIN_ICONS = [
  { key: "ServiceBuilder", dictKey: "builder", icon: Icons.ServiceBuilder },
  { key: "ServiceElectrician", dictKey: "electrician", icon: Icons.ServiceElectrician },
  { key: "ServicePlumber", dictKey: "plumber", icon: Icons.ServicePlumber },
  { key: "ServiceCarpenter", dictKey: "carpenter", icon: Icons.ServiceCarpenter },
  { key: "ServicePainter", dictKey: "painter", icon: Icons.ServicePainter },
  { key: "ServiceWelder", dictKey: "welder", icon: Icons.ServiceWelder },
  { key: "ServiceMechanic", dictKey: "mechanic", icon: Icons.ServiceMechanic },
  { key: "ServiceDailyWorker", dictKey: "dailyWorker", icon: Icons.ServiceDailyWorker },
  { key: "ServiceTailor", dictKey: "tailor", icon: Icons.ServiceTailor },
  { key: "ServiceOther", dictKey: "other", icon: Icons.CategoryOther },
  { key: "Wrench", dictKey: "wrench", icon: Icons.Wrench },
  { key: "User", dictKey: "user", icon: Icons.User },
  { key: "Box", dictKey: "box", icon: Icons.Box },
  { key: "Truck", dictKey: "truck", icon: Icons.Truck },
] as const;

export type ServiceCategoryBuiltinIconKey = (typeof SERVICE_CATEGORY_BUILTIN_ICONS)[number]["key"];

// اعتبارسنجی مقدار icon_key پیش از هرگونه درج/ویرایش (هماهنگ با CHECK constraint دیتابیس روی
// service_categories — این فایل تک‌نقطه‌ی حقیقت آیکون‌های builtin در سمت کد است).
export function isValidBuiltinIconKey(value: string): value is ServiceCategoryBuiltinIconKey {
  return SERVICE_CATEGORY_BUILTIN_ICONS.some((i) => i.key === value);
}

// برای رندر ایمن یک ردیف دیتابیسی: اگر icon_key ناشناخته/قدیمی بود (مثلاً بعداً از کتابخانه
// حذف شد)، به‌جای کرش کردن رابط کاربری، آیکون خنثی «سایر» نمایش داده می‌شود.
export function getBuiltinIconComponent(key: string | null) {
  return SERVICE_CATEGORY_BUILTIN_ICONS.find((i) => i.key === key)?.icon ?? Icons.CategoryOther;
}