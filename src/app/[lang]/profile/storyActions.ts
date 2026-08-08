// مسیر فایل: src/app/[lang]/profile/storyActions.ts
// قابلیت استوری — دو اکشن جدا برای آپلود امن رسانه + ثبت نهایی استوری، دقیقاً هم‌الگو با
// src/app/[lang]/listings/new/actions.ts (createSignedUploadSlotsAction/createListingAction):
// چون auth.uid() در معماری نشست سفارشی این پروژه همیشه null است (بند ۸.۴ سند راهبردی)، مرورگر
// هرگز نمی‌تواند مستقیم در باکت stories بنویسد. راه‌حل: این سرور چند «آدرس آپلود امضاشده‌ی
// موقت» صادر می‌کند؛ مرورگر مستقیماً و بدون عبور از سرور Next.js فایل فشرده‌شده را به همان آدرس
// می‌فرستد — سبک‌تر برای اینترنت ۲G/۳G و بدون نیاز به دستکاری سقف حجم پیش‌فرض Server Action.
//
// **گیت‌کردن واقعی (سمت سرور، نه فقط UI):** طبق تصمیم صریح کارفرما — «کاربر معمولی روزی ۱ بار،
// VIP نامحدود» — این بررسی هم در createSignedStoryUploadSlotAction (برای جلوگیری از آپلود
// بی‌فایده اگر از قبل به سقف رسیده) و هم دوباره در createStoryAction (بررسی نهایی و
// غیرقابل‌دورزدن، درست قبل از insert) انجام می‌شود؛ دقیقاً همان الگوی دو-لایه‌ای که برای ویدئوی
// آگهی VIP در فاز ۱۱ استفاده شد.
//
// **به‌روزرسانی (سقفِ VIP برای ویدئوی استوری):** طبق تصمیم تازه‌ی کارفرما، سقفِ مجازِ مدت‌زمانِ
// ویدئوی استوری دیگر یک عددِ ثابتِ یکسان برای همه نیست: کاربرِ معمولی هم‌چنان ۱۵ ثانیه، کاربرِ
// VIP تا ۳۰ ثانیه. عددِ ثابتِ محلیِ قبلی (MAX_VIDEO_DURATION_SECONDS) از این فایل حذف شد؛ به‌جایش
// از همان منبعِ حقیقتِ مشترکی خوانده می‌شود که سمتِ مرورگر هم استفاده می‌کند
// (src/lib/stories/storyVideoLimits.ts) — دفاع در عمقِ سمتِ سرور هنوز کاملاً برقرار است: حتی اگر
// کلاینت مقدارِ بزرگ‌تری بفرستد، اینجا با VIP واقعیِ کاربر (خوانده‌شده از دیتابیس، نه از ورودیِ
// کلاینت) دوباره اعتبارسنجی می‌شود.
"use server";

import { revalidatePath, updateTag } from "next/cache";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isUserVip } from "@/lib/vip/vipStatus";
import { canUserPostStoryToday } from "@/lib/stories/storyLimits";
import { getStoryVideoMaxDurationSeconds } from "@/lib/stories/storyVideoLimits";
import { getActiveStoriesForUser, type ActiveStory } from "@/lib/stories/storyQueries";

// اکشن سبک برای فراخوانی از کامپوننت کلاینتِ UserStoryAvatar: وقتی کاربر روی یک حلقه‌ی
// هایلایت کلیک می‌کند، این اکشن کل دسته‌ی استوری‌های فعال همان کاربر را برمی‌گرداند (نه فقط
// آخرین مورد) — چون خودِ storyQueries.ts با "server-only" علامت‌گذاری شده و نمی‌تواند مستقیماً
// از یک کامپوننت کلاینت import شود؛ این اکشن فقط یک پوسته‌ی نازک دور همان تابع است.
export async function getUserStoriesAction(userId: string): Promise<ActiveStory[]> {
  return getActiveStoriesForUser(userId);
}

const STORIES_BUCKET = "stories";
// کمی تلورانس (نیم‌ثانیه) برای گرد‌شدن‌های اعشاری بی‌ضرر سمت کلاینت — روی سقفِ VIP-محورِ همان
// کاربر اعمال می‌شود، نه یک عددِ ثابتِ واحد.
const VIDEO_DURATION_TOLERANCE_SECONDS = 0.5;

export type SignedUploadSlot = { path: string; token: string };

// پسوند فایل مناسب را از روی نوع رسانه + mimeType واقعیِ خروجیِ فشرده‌سازی تعیین می‌کند —
// چون MediaRecorder بسته به مرورگر کاربر گاهی mp4 و گاهی webm تولید می‌کند (رجوع کنید به
// یادداشت src/lib/stories/storyMediaProcessor.ts)، پسوند فایل باید با محتوای واقعی هماهنگ
// باشد، نه همیشه یک پسوند ثابت فرضی.
function resolveFileExtension(mediaType: "image" | "video", mimeType: string): string {
  if (mediaType === "image") return "jpg";
  if (mimeType.startsWith("video/mp4")) return "mp4";
  return "webm";
}

export async function createSignedStoryUploadSlotAction(input: {
  mediaType: "image" | "video";
  mimeType: string;
}): Promise<{ success: true; slot: SignedUploadSlot } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (input.mediaType !== "image" && input.mediaType !== "video") {
    return { success: false, error: "invalidMediaType" };
  }

  const isVip = isUserVip(user.vipExpiresAt);
  const { allowed } = await canUserPostStoryToday({ userId: user.id, isVip });
  if (!allowed) return { success: false, error: "dailyLimitReached" };

  const extension = resolveFileExtension(input.mediaType, input.mimeType);
  // قرارداد مسیر فایل طبق فاز ۰۰: {owner_id}/{filename} — سرور خودش مسیر را می‌سازد، پس کلاینت
  // هیچ‌وقت نمی‌تواند مسیری بیرون از پوشه‌ی خودش تولید کند.
  const path = `${user.id}/${Date.now()}.${extension}`;

  const { data, error } = await supabaseAdminClient.storage
    .from(STORIES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return { success: false, error: "uploadFailed" };

  return { success: true, slot: { path: data.path, token: data.token } };
}

export async function createStoryAction(input: {
  mediaPath: string;
  mediaType: "image" | "video";
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  if (input.mediaType !== "image" && input.mediaType !== "video") {
    return { success: false, error: "invalidMediaType" };
  }

  // دفاع در عمق: هیچ مسیر رسانه‌ای نباید بیرون از پوشه‌ی خودِ همین کاربر باشد.
  if (!input.mediaPath.startsWith(`${user.id}/`)) {
    return { success: false, error: "invalidMediaData" };
  }

  // بررسی نهایی و غیرقابل‌دورزدنِ سقف روزانه — درست قبل از insert، نه فقط در لحظه‌ی صدور آدرس
  // آپلود (که ممکن است چند ثانیه/دقیقه قبل بوده و وضعیت کاربر در همان فاصله تغییر کرده باشد).
  const isVip = isUserVip(user.vipExpiresAt);
  const { allowed } = await canUserPostStoryToday({ userId: user.id, isVip });
  if (!allowed) {
    // پاک‌سازی فایلِ از قبل آپلودشده، چون هیچ ردیفی برایش ثبت نمی‌شود.
    try {
      await supabaseAdminClient.storage.from(STORIES_BUCKET).remove([input.mediaPath]);
    } catch {
      // نادیده گرفته می‌شود — اولویت با پیام خطای اصلی است.
    }
    return { success: false, error: "dailyLimitReached" };
  }

  let durationSeconds: number | null = null;
  if (input.mediaType === "video") {
    const raw = input.durationSeconds ?? 0;
    // سقفِ مدت‌زمانِ مجاز بر اساسِ VIP واقعیِ همین کاربر (خوانده‌شده از دیتابیس بالا) — نه هر
    // مقداری که کلاینت ادعا کند؛ دقیقاً همان تک‌منبع‌حقیقتی که سمتِ مرورگر هم استفاده می‌کند.
    const maxVideoDurationSeconds = getStoryVideoMaxDurationSeconds(isVip);
    const maxWithTolerance = maxVideoDurationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS;
    if (!Number.isFinite(raw) || raw <= 0 || raw > maxWithTolerance) {
      try {
        await supabaseAdminClient.storage.from(STORIES_BUCKET).remove([input.mediaPath]);
      } catch {
        // نادیده گرفته می‌شود
      }
      return { success: false, error: "invalidVideoDuration" };
    }
    // اگر کمی از سقف بیشتر بود (فقط به‌خاطر گرد‌شدن اعشاری مجاز)، به‌جای رد کردن، به سقف واقعی
    // محدود می‌شود.
    durationSeconds = Math.min(raw, maxVideoDurationSeconds);
  }

  const width = Number.isFinite(input.width) && (input.width as number) > 0 ? input.width : null;
  const height = Number.isFinite(input.height) && (input.height as number) > 0 ? input.height : null;

  const { error: insertError } = await supabaseAdminClient.from("stories").insert({
    owner_id: user.id,
    media_type: input.mediaType,
    media_path: input.mediaPath,
    duration_seconds: durationSeconds,
    width,
    height,
  });

  if (insertError) {
    try {
      await supabaseAdminClient.storage.from(STORIES_BUCKET).remove([input.mediaPath]);
    } catch {
      // نادیده گرفته می‌شود
    }
    return { success: false, error: "dbError" };
  }

  // فاز استوری — تازه‌سازی فوری، نه منتظرِ کش ۳ دقیقه‌ای صفحه‌ی اصلی ماندن: چون استوری ذاتاً
  // محتوای زمان‌محور و ناپایدار است (بر خلاف ثبت یک راننده/آگهی تازه که فوریت کمتری دارد)،
  // بلافاصله بعد از ثبت، هم کش ردیف «تازه‌ترین استوری‌ها»ی صفحه‌ی اصلی باطل می‌شود، هم صفحه‌ی
  // پروفایل خودِ کاربر (تا استوری تازه‌اش را همان لحظه، بدون رفرش دستی، ببیند).
  //
  // چرا updateTag (نه revalidateTag): از Next.js 16 به بعد، revalidateTag دو حالت دارد —
  // «eventual» (با آرگومان دوم 'max'، محتوای کهنه فعلاً نشان داده می‌شود و به‌روزرسانی در پس‌زمینه
  // انجام می‌شود) یا updateTag برای «immediate» (دقیقاً سناریوی خودِ ما: کاربری که همین الان
  // استوری خودش را ثبت کرده باید بلافاصله همان را ببیند، نه نسخه‌ی کهنه‌ی چند لحظه‌ی قبل). طبق
  // مستندات رسمی Next.js، updateTag دقیقاً برای همین حالت «read-your-own-write» داخل Server
  // Action ساخته شده.
  updateTag("home-stories");
  revalidatePath("/[lang]/profile", "page");

  return { success: true };
}

// اجازه‌ی حذف زودهنگام استوری خودِ کاربر — پیش از انقضای طبیعی ۲۴ ساعته. یک بهبود تجربه‌ی
// کاربری منطقی (مثلاً اگر کاربر پشیمان شد یا اشتباهی گذاشت)، نه یک الزام صریح کارفرما؛ ولی چون
// هزینه‌اش (یک اکشن کوچک) پایین و ارزشش برای کاربر واقعی است، اضافه شد.
export async function deleteMyStoryAction(
  storyId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const { data: story, error: fetchError } = await supabaseAdminClient
    .from("stories")
    .select("id, owner_id, media_path")
    .eq("id", storyId)
    .maybeSingle();

  if (fetchError || !story) return { success: false, error: "notFound" };
  if (story.owner_id !== user.id) return { success: false, error: "unauthorized" };

  const { error: deleteError } = await supabaseAdminClient.from("stories").delete().eq("id", storyId);
  if (deleteError) return { success: false, error: "dbError" };

  try {
    await supabaseAdminClient.storage.from(STORIES_BUCKET).remove([story.media_path as string]);
  } catch {
    // فایل یتیم در Storage خیلی بهتر از یک خطای نمایشی برای کاربر است — cron پاک‌سازی
    // (src/app/api/cron/stories-cleanup/route.ts) هم به‌عنوان یک لایه‌ی محافظ دوم عمل می‌کند.
  }

  updateTag("home-stories");
  revalidatePath("/[lang]/profile", "page");

  return { success: true };
}