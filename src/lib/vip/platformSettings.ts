// مسیر فایل: src/lib/vip/platformSettings.ts
// فاز ۱۱ — لایه‌ی خواندن/نوشتن جدول platform_settings (کلید-مقدار سراسری).
//
// طبق بند ۳ پرامپت VIP: این جدول عمداً یک زیرساخت عمومی طراحی شده، نه چیزی مخصوص VIP — در آینده
// هر تنظیم سراسری دیگری (مثلاً متن اطلاعیه‌ی صفحه‌ی اصلی) هم می‌تواند از همین جدول با یک کلید
// تازه استفاده کند، بدون نیاز به migration یا جدول جدید.
//
// این فایل فقط سه کلید فعلی VIP را با نام‌های ثابت (نه رشته‌ی آزاد در هرجا) در دسترس می‌گذارد تا
// اشتباه تایپی نام کلید در فایل‌های مصرف‌کننده ممکن نباشد.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";

export const VIP_SETTINGS_KEYS = {
  monthlyPrice: "vip_monthly_price",
  bankDetails: "vip_bank_details",
  exchangeDetails: "vip_exchange_details",
} as const;

export type VipSettings = {
  monthlyPrice: number;
  bankDetails: string;
  exchangeDetails: string;
};

const DEFAULTS: VipSettings = {
  monthlyPrice: 0,
  bankDetails: "",
  exchangeDetails: "",
};

// خواندن یک کلید دلخواه از platform_settings — برای استفاده‌ی عمومی در آینده.
export async function getPlatformSetting(key: string): Promise<string | null> {
  const { data, error } = await supabaseAdminClient
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return null;
  return data.value as string;
}

export async function setPlatformSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabaseAdminClient
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  return !error;
}

// خواندن هر سه تنظیم VIP با یک درخواست (نه سه درخواست جدا) — برای صفحه‌ی /vip و پنل مدیریت.
export async function getVipSettings(): Promise<VipSettings> {
  const { data, error } = await supabaseAdminClient
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      VIP_SETTINGS_KEYS.monthlyPrice,
      VIP_SETTINGS_KEYS.bankDetails,
      VIP_SETTINGS_KEYS.exchangeDetails,
    ]);

  if (error || !data) return DEFAULTS;

  const map = new Map(data.map((row) => [row.key as string, row.value as string]));

  return {
    monthlyPrice: Number(map.get(VIP_SETTINGS_KEYS.monthlyPrice)) || DEFAULTS.monthlyPrice,
    bankDetails: map.get(VIP_SETTINGS_KEYS.bankDetails) ?? DEFAULTS.bankDetails,
    exchangeDetails: map.get(VIP_SETTINGS_KEYS.exchangeDetails) ?? DEFAULTS.exchangeDetails,
  };
}

export async function updateVipSettings(input: {
  monthlyPrice: string;
  bankDetails: string;
  exchangeDetails: string;
}): Promise<boolean> {
  const priceNumber = Number(input.monthlyPrice);
  if (!Number.isFinite(priceNumber) || priceNumber < 0) return false;

  const results = await Promise.all([
    setPlatformSetting(VIP_SETTINGS_KEYS.monthlyPrice, String(priceNumber)),
    setPlatformSetting(VIP_SETTINGS_KEYS.bankDetails, input.bankDetails.trim()),
    setPlatformSetting(VIP_SETTINGS_KEYS.exchangeDetails, input.exchangeDetails.trim()),
  ]);

  return results.every(Boolean);
}