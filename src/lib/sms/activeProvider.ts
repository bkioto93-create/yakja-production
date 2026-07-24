// مسیر فایل: src/lib/sms/activeProvider.ts
// تک‌نقطه‌ی تعویض Provider پیامک واقعی در آینده (بند ۸.۲.۴ سند راهبردی).
// همه‌ی بخش‌های پروژه (صفحات ورود، اکشن‌های سرور) باید فقط از همین فایل smsProvider را
// import کنند؛ هرگز mockProvider را مستقیماً در جای دیگری import نکنید. وقتی پنل پیامک واقعی
// خریداری شد، فقط همین یک خط export تغییر می‌کند — هیچ فایل دیگری لازم نیست دست بخورد.
import "server-only";
import { mockSmsProvider } from "./mockProvider";
import type { SmsProvider } from "./smsProvider";

export const smsProvider: SmsProvider = mockSmsProvider;