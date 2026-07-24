// مسیر فایل: src/app/api/mobile/v1/marketplace/my-listings/route.ts
// فاز M02 موبایل، تسک ۷ — برخلاف دو Route دیگر همین پوشه، این یکی معادل هیچ Server Action وبی
// نیست (وب چنین صفحه‌ای اصلاً ندارد؛ بند ۳ سند راهبردی موبایل). منطق خواندنش هم به همین دلیل تازه
// نوشته شد: getMyListings در src/lib/marketplace/queries.ts (پایین همین پوشه‌بندی، فایل ویرایش‌شده
// پیوست) — دقیقاً هم‌الگو با تابع‌های دیگر همان فایل، فقط برخلاف آن‌ها با supabaseAdminClient
// (نه rpc) چون این کوئری روی ستون‌های ساده کار می‌کند نه geography.
//
// رفتار برای کاربر مهمان: دقیقاً هم‌رفتار با GET /api/mobile/v1/profile (فاز M01) — پاسخ خالی،
// نه خطا (سمت موبایل هم اصلاً این Route را برای مهمان صدا نمی‌زند؛ خودش قبلش useAuth().user را
// چک می‌کند — این شاخه فقط برای درخواست‌های مستقیم/غیرمعمول اهمیت دارد).
//
// خروجی: { listings: MyListingRow[] } — فیلدها camelCase (id, category, title, price, address,
//   images, status, createdAt). «images» همان مسیرهای خامِ Storage است؛ ساخت URL کامل برای
//   نمایش، سمت موبایل با تابع همتای mobile/lib/marketplace/images.ts انجام می‌شود.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyListings } from "@/lib/marketplace/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ listings: [] });
  }

  const listings = await getMyListings(user.id);
  return NextResponse.json({ listings });
}