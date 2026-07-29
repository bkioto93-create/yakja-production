// مسیر فایل: src/lib/provinces.ts
// فاز ۱۰ — تک‌نقطه‌ی حقیقت لیست ۳۴ ولایت افغانستان — قابلیت «انتخاب ولایت» (درخواست مستقیم
// کارفرما: دقیقاً مثل سیستم انتخاب شهر در دیوار — هر کاربر ولایت خودش را انتخاب می‌کند و
// آگهی‌ها/رانندگان/متخصصین/املاک بر اساس همان ولایت فیلتر می‌شوند، نه سراسری کل افغانستان).
//
// دقیقاً هم‌الگو با src/lib/transport/vehicleTypes.ts: این فایل فقط شناسه/ترتیب را مشخص می‌کند؛
// نام هر ولایت هرگز اینجا هاردکد نمی‌شود (طبق الزام قطعی ۲) و همیشه باید از طریق
// dict.province.names[id] خوانده شود (دری در fa.ts، پشتو در ps.ts). مقدار id دقیقاً همان مقداری
// است که در ستون‌های listings.province / drivers.province / service_providers.province /
// real_estate.province — با یک CHECK constraint هم‌سو با همین لیست (رجوع کنید به
// 21_phase_10_province_feature.sql) — ذخیره می‌شود.
//
// ترتیب لیست: طبق تقسیم‌بندی رایج منطقه‌ای افغانستان (مرکز، شرق، جنوب‌شرق/جنوب، غرب، مرکز-کوهستانی،
// شمال) — نه صرفاً الفبایی — چون این ترتیب برای اکثر کاربران افغان آشناتر و قابل‌پیش‌بینی‌تر است.
//
// ⚠️ یادداشت زبانی (هم‌سو با یادداشت مشابه در 19_phase_09_service_categories_ps_translation_fix.sql):
// نام‌های پشتوی این فهرست (در ps.ts) توسط هوش مصنوعی و با بهترین دانش زبانی موجود نوشته شده‌اند،
// نه توسط یک مترجم گواهی‌شده یا بومی‌گوی پشتو. پیش از انتشار نهایی عمومی، یک بازبینی سریع توسط
// کارفرما یا یک بومی‌گوی پشتو (به‌خصوص برای املای «کندهار» و «اروزگان») توصیه می‌شود — دقیقاً
// از پنل مدیریت (در صورت افزوده‌شدن چنین پنلی برای این فهرست در آینده)، بدون نیاز به تغییر کد.
export const PROVINCES = [
  { id: "kabul", dictKey: "kabul" },
  { id: "kapisa", dictKey: "kapisa" },
  { id: "parwan", dictKey: "parwan" },
  { id: "wardak", dictKey: "wardak" },
  { id: "logar", dictKey: "logar" },
  { id: "nangarhar", dictKey: "nangarhar" },
  { id: "laghman", dictKey: "laghman" },
  { id: "kunar", dictKey: "kunar" },
  { id: "nuristan", dictKey: "nuristan" },
  { id: "panjshir", dictKey: "panjshir" },
  { id: "paktia", dictKey: "paktia" },
  { id: "paktika", dictKey: "paktika" },
  { id: "khost", dictKey: "khost" },
  { id: "ghazni", dictKey: "ghazni" },
  { id: "helmand", dictKey: "helmand" },
  { id: "kandahar", dictKey: "kandahar" },
  { id: "zabul", dictKey: "zabul" },
  { id: "uruzgan", dictKey: "uruzgan" },
  { id: "nimroz", dictKey: "nimroz" },
  { id: "farah", dictKey: "farah" },
  { id: "herat", dictKey: "herat" },
  { id: "badghis", dictKey: "badghis" },
  { id: "ghor", dictKey: "ghor" },
  { id: "daykundi", dictKey: "daykundi" },
  { id: "bamyan", dictKey: "bamyan" },
  { id: "balkh", dictKey: "balkh" },
  { id: "jowzjan", dictKey: "jowzjan" },
  { id: "faryab", dictKey: "faryab" },
  { id: "sar_e_pol", dictKey: "sar_e_pol" },
  { id: "samangan", dictKey: "samangan" },
  { id: "baghlan", dictKey: "baghlan" },
  { id: "kunduz", dictKey: "kunduz" },
  { id: "takhar", dictKey: "takhar" },
  { id: "badakhshan", dictKey: "badakhshan" },
] as const;

export type ProvinceId = (typeof PROVINCES)[number]["id"];

// ۵ ولایت پرجمعیت/پرکاربردتر — به‌عنوان میان‌بر/چیپ سریع در بالای فهرست انتخابگر نمایش داده
// می‌شوند تا اکثر کاربران بدون اسکرول یا جستجو، ولایت خود را یک‌لمسی پیدا کنند (بند «اولویت
// سادگی حداکثری برای کاربران کم‌تجربه»، سند راهبردی).
export const POPULAR_PROVINCE_IDS: ProvinceId[] = ["kabul", "herat", "balkh", "kandahar", "nangarhar"];

// اعتبارسنجی مقدار ولایت پیش از هرگونه درج/ویرایش یا فیلتر (هماهنگ با CHECK constraint
// دیتابیس) — دقیقاً هم‌الگو با isValidVehicleType.
export function isValidProvince(value: string): value is ProvinceId {
  return PROVINCES.some((p) => p.id === value);
}