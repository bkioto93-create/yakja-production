// مسیر فایل: src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// کلاینت سمت مرورگر — با Anon Key کار می‌کند و کاملاً تابع سیاست‌های RLS است.
// این نمونه را در کامپوننت‌های Client (فرم‌ها، صفحات تعاملی) استفاده کن.
export const supabaseBrowserClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);