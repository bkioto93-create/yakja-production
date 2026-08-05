// مسیر فایل: src/app/api/mobile/v1/chat/route.ts
// قابلیت چت (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ فهرستِ «چت‌های من». صفر منطق تجاری تازه —
// همان getMyConversations موجود (src/lib/chat/chatQueries.ts) صدا زده می‌شود.
//
// **نکته‌ی طراحی (برچسب‌های fallback):** getMyConversations سه پارامترِ متنی می‌گیرد
// (fallbackLabel/voiceMessagePreviewLabel/adminSupportLabel) که وب مستقیماً از dict خودش پر
// می‌کند. چون این Route زبانِ کاربر را نمی‌داند (موبایل زبان را کاملاً سمت کلاینت با
// LanguageContext مدیریت می‌کند، نه از مسیر URL مثل وب)، این سه پارامتر با رشته‌ی خالی/یک
// نشانگرِ خنثی پر می‌شوند — دقیقاً هم‌الگو با ownerName خام در getNewestDriversForHome (که
// fallback واقعی، «کاربر یکجا»، همیشه سمت کلاینتِ موبایل با dict خودش اعمال می‌شود، نه سمت
// سرور). رجوع کنید به lib/chat/api.ts در ریپازیتوری موبایل برای دقیقاً کجا این جایگزینی انجام
// می‌شود.
//
// **محدوده‌ی این تحویل (فاز الف — متن‌محور):** ردیفِ ثابتِ «چت با پشتیبانی» (که وب در page.tsx
// جداگانه می‌سازد) عمداً اینجا نیست — به فازِ بعدیِ موبایل موکول شد.
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyConversations } from "@/lib/chat/chatQueries";

// نشانگرِ داخلی برای پیش‌نمایشِ پیامِ صوتی — چون "" (رشته‌ی خالی) از قبل معنای طبیعیِ خودش را
// دارد («اصلاً پیامی نیست»، رجوع کنید به منطق خودِ getMyConversations)، برای تشخیصِ حالتِ سوم
// («آخرین پیام صوتی بود») یک نشانگرِ مجزا لازم است.
const VOICE_MARKER = "\u0000VOICE\u0000";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: true, conversations: [] });

  const conversations = await getMyConversations(user.id, "", VOICE_MARKER, "");
  return NextResponse.json({ success: true, conversations, voiceMarker: VOICE_MARKER });
}