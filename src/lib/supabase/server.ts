// مسیر فایل: src/lib/supabase/server.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

// کلاینت سمت سرور/ادمین — با Service Role Key کار می‌کند و سیاست‌های RLS را دور می‌زند.
// فقط داخل Server Actions یا Route Handler ها (فایل‌های route.ts، actions.ts) استفاده شود.
// import "server-only" تضمین می‌کند این فایل هرگز اشتباهاً داخل باندل مرورگر قرار نگیرد.
export const supabaseAdminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);