// مسیر فایل: src/lib/auth/session.ts
// معماری نشست کاربری سفارشی — بند ۸.۴ سند راهبردی. چون احراز هویت کاملاً سفارشی است
// (نه سیستم Auth بومی Supabase)، نشست با یک کوکی httpOnly امضاشده (HMAC-SHA256) مدیریت می‌شود
// که فقط شناسه‌ی کاربر را در خود دارد. تمام خواندن/نوشتن داده‌ی اختصاصی کاربر باید از طریق
// Server Action/Route Handler و supabaseAdminClient انجام شود، نه با تکیه بر auth.uid() در RLS.
//
// **به‌روزرسانی تسک ۱ فاز ۰۷ (مسیر ورود مجزای ادمین):** پیش از این تسک، نشست فقط شناسه‌ی کاربر
// را حمل می‌کرد و `requireAdmin` صرفاً `role='admin'` را بررسی می‌کرد؛ یعنی هر کاربری که از
// طریق جریان عمومی OTP (`/auth/verify`) وارد می‌شد و به‌هر دلیل `role='admin'` داشت، همچنان
// می‌توانست وارد `/admin/*` شود — دقیقاً همان محدودیتی که تسک ۱ فاز ۰۷ باید برطرف می‌کرد.
// برای رفع قطعی (نه فقط ظاهری/UI) این تداخل، خودِ کوکی نشست حالا «روش احراز هویت»
// (`authMethod`: `otp` یا `password`) را هم در خود حمل می‌کند. `requireAdmin` از این پس علاوه بر
// `role='admin'`، `authMethod==='password'` را هم الزامی می‌کند؛ یعنی فقط نشستی که از طریق فرم
// اختصاصی `/admin/login` (نام‌کاربری+رمزعبور، در src/app/[lang]/admin/login/actions.ts) ساخته
// شده باشد اجازه‌ی ورود به پنل مدیریت را دارد. نشستی که از جریان OTP عمومی ساخته شده، حتی اگر
// متعلق به یک ردیف کاربری با role='admin' باشد، دیگر هرگز این بررسی را رد نمی‌کند.
//
// **به‌روزرسانی تسک ۱ فاز M01 (لایه‌ی API موبایل):** اپلیکیشن اندروید (پروژه‌ی Expo، ریپازیتوری
// مجزا) کوکی مرورگر ندارد — طبق بند ۵ سند راهبردی موبایل، توکن نشست به‌جای `Set-Cookie` در بدنه‌ی
// JSON پاسخ به اپ برگردانده می‌شود و اپ آن را در `expo-secure-store` نگه می‌دارد و در هدر
// `Authorization: Bearer <token>` هر درخواست بعدی به `/api/mobile/v1/*` می‌فرستد. برای این‌که
// همان Route Handlerهای مسیر موبایل بتوانند کاربر را بشناسند، فقط منبعِ خواندنِ «رشته‌ی خام نشست»
// یک شاخه‌ی جایگزین گرفت (تابع تازه‌ی `getRawSessionToken`): اول کوکی چک می‌شود (رفتار فعلی وب،
// بدون کوچک‌ترین تغییر)؛ اگر کوکی نبود، از هدر `Authorization` خوانده می‌شود. خودِ رشته‌ی توکن —
// چه از کوکی بیاید چه از هدر — دقیقاً با همان منطق قبلی (split چهار‌بخشی، `sign`/`timingSafeEqual`،
// بررسی انقضا) اعتبارسنجی می‌شود؛ یعنی منطق تایید امضا حتی یک خط هم تغییر نکرده، فقط یک ورودی
// دوم برای همان منطق اضافه شده. `destroySession`, `getCurrentUser`, `requireAdmin` هم امضا و هم
// رفتارشان برای وب دقیقاً همان قبل باقی مانده.
//
// **به‌روزرسانی تسک ۳ فاز M01 (verify-otp موبایل):** طبق معماری مستند‌شده («توکن امضاشده... فقط
// به‌جای Set-Cookie، در بدنه‌ی JSON پاسخ برمی‌گردد»)، مسیر موبایل بعد از تایید موفق OTP باید همان
// رشته‌ی امضاشده‌ای که وب در کوکی می‌گذارد را در بدنه‌ی JSON هم داشته باشد — نه یک توکن دوم و
// جداگانه (که هم دوباره‌کاری بی‌دلیل بود، هم دو مقدار متفاوت برای یک نشست می‌ساخت). به‌جای
// بازتولید منطق امضا در جای دوم، تنها یک تغییر افزایشی/Additive انجام شد: `createSession` از این
// پس همان رشته‌ای را که تا پیش از این فقط داخلی می‌ساخت و در کوکی می‌گذاشت، به‌عنوان مقدار
// بازگشتی هم برمی‌گرداند (`Promise<void>` → `Promise<string>`). چون هر دو فراخوانی موجود
// (`src/app/[lang]/admin/login/actions.ts` و `src/app/[lang]/auth/verify/actions.ts`) با
// `await createSession(...)` بدون استفاده از مقدار بازگشتی صدا زده می‌شوند، این تغییر برای وب صفر
// اثر رفتاری دارد؛ فقط یک مسیر مصرف تازه (خواندن توکن برای پاسخ JSON موبایل) را ممکن می‌کند.
import "server-only";
import { cookies, headers } from "next/headers";
import crypto from "node:crypto";
import { supabaseAdminClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "yakja_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // ۳۰ روز

// روش احراز هویتی که این نشست از طریق آن ساخته شده — `otp` برای جریان عمومی شماره‌موبایل+کد،
// `password` برای مسیر مجزای ادمین (`/admin/login`). این مقدار داخل خودِ کوکی امضاشده ذخیره
// می‌شود تا از سمت کاربر قابل جعل نباشد.
export type SessionAuthMethod = "otp" | "password";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET در متغیرهای محیطی تعریف نشده یا خیلی کوتاه است؛ بدون این مقدار، نشست کاربران قابل امضا و اعتبارسنجی امن نیست."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export type SessionUser = {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: string;
  language: string;
  authMethod: SessionAuthMethod;
};

// `authMethod` پیش‌فرض `"otp"` دارد تا فراخوانی‌های موجود (جریان تایید OTP) بدون تغییر امضا هم
// همچنان کار کنند؛ مسیر ورود مجزای ادمین صراحتاً `"password"` را پاس می‌دهد.
// خروجی `Promise<string>` (تسک ۳ فاز M01): همان رشته‌ی نشستِ امضاشده که در کوکی هم گذاشته
// می‌شود، این‌بار به فراخواننده هم برگردانده می‌شود — تا مسیر موبایل بتواند دقیقاً همین مقدار را
// در بدنه‌ی JSON به اپ بدهد، بدون ساختن یک نشست/امضای دوم و جدا.
export async function createSession(
  userId: string,
  authMethod: SessionAuthMethod = "otp"
): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${authMethod}.${expiresAt}`;
  const signature = sign(payload);
  const cookieValue = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return cookieValue;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// تسک ۱ فاز M01: منبع «رشته‌ی خام نشست» را از دو جا می‌خواند — اول کوکی (رفتار فعلی و
// بدون‌تغییر وب)، و فقط اگر کوکی نبود، از هدر `Authorization: Bearer <token>` (مسیر اپ موبایل،
// که کوکی مرورگر ندارد). اولویت همیشه با کوکی است؛ یعنی برای یک درخواست معمولی مرورگر، رفتار
// دقیقاً همان قبل از این تسک است. این تابع فقط رشته‌ی خام را برمی‌گرداند — بدون هیچ اعتبارسنجی؛
// اعتبارسنجی (امضا/انقضا) همچنان به‌طور کامل داخل `readSession` و دقیقاً با همان منطق قبلی انجام
// می‌شود.
async function getRawSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (cookieValue) return cookieValue;

  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (!token || scheme?.toLowerCase() !== "bearer") return null;

  return token;
}

// قبلاً `readSessionUserId` فقط شناسه‌ی کاربر را برمی‌گرداند؛ حالا `authMethod` را هم همراه آن
// برمی‌گرداند تا `getCurrentUser`/`requireAdmin` بتوانند روش ورود را هم بررسی کنند. کوکی‌های
// قدیمی (ساخته‌شده پیش از این تسک، با ۳ بخش به‌جای ۴ بخش) دیگر معتبر شناخته نمی‌شوند و کاربر
// باید دوباره وارد شود — پیامد امنیتی این موضوع بی‌خطر و حتی مطلوب است.
//
// (تسک ۱ فاز M01: تنها تغییر این تابع، خواندنِ رشته‌ی خام از `getRawSessionToken` به‌جای مستقیم
// از کوکی است — خودِ منطق split/امضا/انقضا زیر این خط، حرف‌به‌حرف با نسخه‌ی قبل از این تسک یکسان
// مانده.)
async function readSession(): Promise<{ userId: string; authMethod: SessionAuthMethod } | null> {
  const raw = await getRawSessionToken();
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [userId, authMethodRaw, expiresAtStr, signature] = parts;

  if (authMethodRaw !== "otp" && authMethodRaw !== "password") return null;

  const expectedSignature = sign(`${userId}.${authMethodRaw}.${expiresAtStr}`);
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return { userId, authMethod: authMethodRaw };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await readSession();
  if (!session) return null;

  const { data, error } = await supabaseAdminClient
    .from("users")
    .select("id, phone_number, name, role, language, is_blocked")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !data || data.is_blocked) return null;

  return {
    id: data.id,
    phoneNumber: data.phone_number,
    name: data.name,
    role: data.role,
    language: data.language,
    authMethod: session.authMethod,
  };
}

// از این پس، فقط نشستی که هم `role='admin'` باشد و هم از طریق مسیر مجزای رمزعبوریِ ادمین
// (`authMethod==='password'`) ساخته شده باشد، اجازه‌ی ورود به `/admin/*` را دارد — طبق تسک ۱
// فاز ۰۷ («ساخت مسیر ورود مجزا برای ادمین، کاملاً جدا از حساب‌های کاربری عادی OTP»).
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin" || user.authMethod !== "password") return null;
  return user;
}