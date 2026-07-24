// مسیر فایل: src/app/api/health/route.ts
// تسک ۱۰ فاز ۰۰ — مسیر Health Check برای تایید اتصال موفق به Supabase
import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // یک کوئری سبک روی جدول users فقط برای اطمینان از برقراری اتصال (بدون افشای داده‌ی حساس)
    const { error } = await supabaseAdminClient
      .from("users")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          supabase: "disconnected",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      supabase: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        supabase: "disconnected",
        message: err instanceof Error ? err.message : "خطای نامشخص",
      },
      { status: 500 }
    );
  }
}