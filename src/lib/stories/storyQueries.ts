// مسیر فایل: src/lib/stories/storyQueries.ts
// قابلیت استوری — لایه‌ی خواندن داده. سه نوع کوئری مجزا با سه هدف متفاوت:
//
//   ۱) getActiveStoriesForUser: کل «دسته‌ی» استوری‌های فعال یک کاربر، برای Viewer تمام‌صفحه —
//      وقتی کاربری VIP در یک روز چند استوری گذاشته باشد، همه‌ی آن‌ها پشت‌سرهم و به ترتیب
//      زمانی (قدیمی‌ترین اول) نمایش داده می‌شوند، دقیقاً مثل اینستاگرام.
//
//   ۲) getStoryOwnerIdsWithActiveStories: یک کوئری دسته‌ای سبک («کدام‌یک از این کاربرها الان
//      استوری فعال دارند؟») — برای رسم حلقه‌ی هایلایت دور آواتار، بدون این‌که لازم باشد به‌ازای
//      هر آواتار یک کوئری جداگانه بزنیم (N+1). امروز فقط با یک id صدا زده می‌شود (پروفایل خودم/
//      پروفایل عمومی)، ولی طراحی‌اش از اول برای آرایه‌ای از idها است — دقیقاً برای این‌که فردا
//      وقتی حلقه‌ی استوری به کارت آگهی/راننده/متخصص هم اضافه شد، همین یک تابع (با یک IN بزرگ‌تر)
//      کافی باشد، نه یک تابع تازه.
//
//   ۳) getLatestStoriesForHome: ردیف «تازه‌ترین استوری‌ها»ی صفحه‌ی اصلی — یک استوری (آخرین) به
//      ازای هر کاربر یکتا، جدیدترین کاربرها اول.
//
// **سنجاق‌شدنِ استوریِ مدیریت (به‌روزرسانی):** طبق درخواست صریح کارفرما، اگر «حساب رسمی
// مدیریت یکجا» (رجوع کنید به src/lib/admin/officialAccount.ts) همین حالا یک استوری فعال داشته
// باشد، همیشه — در ردیف صفحه‌ی اصلی (fetchLatestStoriesForHome) و در صفحه‌ی «همه استوری‌ها»
// (fetchStoriesPage، فقط در اولین صفحه/cursor=null) — به‌عنوان اولین آیتم برگردانده می‌شود،
// جدا از نوبتِ عادیِ «جدیدترین اول». هر آیتمِ خروجی حالا یک پرچمِ isOfficial هم دارد تا لایه‌ی
// نمایش (StoriesShowcase.tsx / AllStoriesClient.tsx) بتواند حلقه/جداکننده‌ی متفاوتی برایش
// نشان دهد.
import "server-only";
import { supabaseAdminClient } from "@/lib/supabase/server";
import { getStoryMediaUrl } from "@/lib/stories/images";
import { getOfficialAdminId } from "@/lib/admin/officialAccount";

export type StoryMediaType = "image" | "video";

export type ActiveStory = {
  id: string;
  mediaType: StoryMediaType;
  mediaUrl: string;
  durationSeconds: number | null;
  createdAt: string;
};

// دسته‌ی کامل استوری‌های فعال یک کاربر، قدیمی‌ترین اول (ترتیب طبیعی تماشای پشت‌سرهم).
export async function getActiveStoriesForUser(userId: string): Promise<ActiveStory[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdminClient
    .from("stories")
    .select("id, media_type, media_path, duration_seconds, created_at")
    .eq("owner_id", userId)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    mediaType: row.media_type as StoryMediaType,
    mediaUrl: getStoryMediaUrl(row.media_path as string),
    durationSeconds: row.duration_seconds as number | null,
    createdAt: row.created_at as string,
  }));
}

// کوئری دسته‌ای برای حلقه‌ی هایلایت — رجوع کنید به توضیح بالای فایل.
export async function getStoryOwnerIdsWithActiveStories(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const nowIso = new Date().toISOString();
  const { data } = await supabaseAdminClient
    .from("stories")
    .select("owner_id")
    .in("owner_id", userIds)
    .gt("expires_at", nowIso);

  return new Set((data ?? []).map((row) => row.owner_id as string));
}

// نسخه‌ی تک‌کاربره‌ی همان کوئری بالا — برای جاهایی که فقط یک آواتار (نه فهرست) داریم، مثل کارت
// هویت خودِ کاربر در پروفایل. عمداً به‌جای منطق جدا، همان تابع دسته‌ای را با یک آرایه‌ی تک‌عضوی
// صدا می‌زند — یک منبع حقیقت برای «آیا این کاربر استوری فعال دارد؟».
export async function hasActiveStory(userId: string): Promise<boolean> {
  const owners = await getStoryOwnerIdsWithActiveStories([userId]);
  return owners.has(userId);
}

export type HomeStoryPreview = {
  storyId: string;
  ownerId: string;
  ownerName: string | null;
  mediaType: StoryMediaType;
  mediaUrl: string;
  createdAt: string;
  // true فقط برای استوریِ سنجاق‌شده‌ی «حساب رسمی مدیریت یکجا» — رجوع کنید به توضیح بالای فایل.
  isOfficial: boolean;
};

// آخرین استوریِ فعالِ «حساب رسمی مدیریت یکجا» (اگر باشد) — به همراه اسم فعلیِ همان حساب.
// جدا از fetchLatestBatch پایین نگه داشته شد چون این یکی همیشه دقیقاً یک صاحب (adminId) دارد،
// نه یک دسته‌ی چندصاحبی، و چون نیازی به یکتاسازیِ owner_id ندارد.
async function fetchOfficialStoryPreview(adminId: string): Promise<HomeStoryPreview | null> {
  const nowIso = new Date().toISOString();

  const [{ data: storyRow }, { data: ownerRow }] = await Promise.all([
    supabaseAdminClient
      .from("stories")
      .select("id, media_type, media_path, created_at")
      .eq("owner_id", adminId)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdminClient.from("users").select("name").eq("id", adminId).maybeSingle(),
  ]);

  if (!storyRow) return null;

  return {
    storyId: storyRow.id as string,
    ownerId: adminId,
    ownerName: (ownerRow?.name as string | null) ?? null,
    mediaType: storyRow.media_type as StoryMediaType,
    mediaUrl: getStoryMediaUrl(storyRow.media_path as string),
    createdAt: storyRow.created_at as string,
    isOfficial: true,
  };
}

// «تازه‌ترین استوری‌ها» — یک استوری (آخرین) به ازای هر کاربر یکتا، جدا از تصمیمِ سنجاق‌کردنِ
// استوریِ رسمی که پیرامون این تابع گرفته می‌شود. excludeOwnerIds برای جلوگیری از دوباره‌آمدنِ
// صاحبی است که از قبل جداگانه (مثلاً به‌عنوان استوریِ رسمیِ سنجاق‌شده) در خروجی قرار گرفته.
//
// چرا یک کوئری Postgres با DISTINCT ON به‌جای این پیاده‌سازی نوشته نشد: supabase-js از
// DISTINCT ON پشتیبانی مستقیم ندارد (نیازمند یک تابع RPC مجزا می‌شد). در عوض، یک دسته‌ی نسبتاً
// بزرگ‌تر از حد نیاز واقعی خوانده می‌شود (limit×۸، حداقل ۸۰ ردیف) و یکتاسازی بر اساس owner_id
// در حافظه‌ی Node انجام می‌شود — در مقیاس فعلی پروژه (چند ده/صد استوری هم‌زمان فعال) این
// سبک‌تر و ساده‌تر از نگهداری یک تابع Postgres اضافه است؛ اگر مقیاس پروژه بعداً خیلی بزرگ‌تر
// شد، این تابع کاندید اول برای تبدیل به یک RPC است.
async function fetchLatestBatch(
  limit: number,
  excludeOwnerIds: Set<string>
): Promise<HomeStoryPreview[]> {
  if (limit <= 0) return [];

  const nowIso = new Date().toISOString();
  const fetchBatchSize = Math.max(limit * 8, 80);

  const { data, error } = await supabaseAdminClient
    .from("stories")
    .select("id, owner_id, media_type, media_path, created_at")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(fetchBatchSize);

  if (error || !data || data.length === 0) return [];

  // seenOwners از قبل با excludeOwnerIds پر می‌شود — یعنی صاحب‌های مستثنا هم دقیقاً مثل «قبلاً
  // دیده‌شده» رفتار می‌کنند و بدون هیچ منطق جداگانه، به‌طور طبیعی از خروجی این دسته کنار می‌مانند.
  const seenOwners = new Set<string>(excludeOwnerIds);
  const latestPerOwner: typeof data = [];
  for (const row of data) {
    const ownerId = row.owner_id as string;
    if (seenOwners.has(ownerId)) continue;
    seenOwners.add(ownerId);
    latestPerOwner.push(row);
    if (latestPerOwner.length >= limit) break;
  }

  if (latestPerOwner.length === 0) return [];

  const ownerIds = latestPerOwner.map((row) => row.owner_id as string);
  const { data: owners } = await supabaseAdminClient
    .from("users")
    .select("id, name")
    .in("id", ownerIds);
  const ownerById = new Map((owners ?? []).map((o) => [o.id as string, o]));

  return latestPerOwner.map((row) => ({
    storyId: row.id as string,
    ownerId: row.owner_id as string,
    ownerName: ownerById.get(row.owner_id as string)?.name ?? null,
    mediaType: row.media_type as StoryMediaType,
    mediaUrl: getStoryMediaUrl(row.media_path as string),
    createdAt: row.created_at as string,
    isOfficial: false,
  }));
}

async function fetchLatestStoriesForHome(limit: number): Promise<HomeStoryPreview[]> {
  const adminId = await getOfficialAdminId();
  const officialStory = adminId ? await fetchOfficialStoryPreview(adminId) : null;

  const remainingLimit = officialStory ? Math.max(limit - 1, 0) : limit;
  const excludeOwnerIds = officialStory ? new Set([officialStory.ownerId]) : new Set<string>();
  const rest = await fetchLatestBatch(remainingLimit, excludeOwnerIds);

  return officialStory ? [officialStory, ...rest] : rest;
}

// ---------------------------------------------------------------------------
// صفحه‌ی «همه استوری‌ها» — خواندنِ صفحه‌به‌صفحه (Cursor Pagination).
//
// چرا صفحه‌به‌صفحه و نه یک‌جا: طبق بند صریح کارفرما درباره‌ی اینترنت ضعیف در افغانستان، هرگز
// نباید همه‌ی استوری‌ها با هم لود شوند. این تابع هر بار فقط یک دسته‌ی کوچک برمی‌گرداند و کاربر
// با اسکرول‌کردن (یا زدن دکمه‌ی «نمایش بیشتر») دسته‌ی بعدی را می‌گیرد.
//
// چرا Cursor و نه offset: با offset (`.range(20,39)`) اگر بین دو درخواست یک استوری منقضی شود،
// کل پنجره یک ردیف می‌لغزد و کاربر یک استوری را از دست می‌دهد یا دوباره می‌بیند. Cursor بر پایه‌ی
// created_at این مشکل را ندارد چون همیشه می‌گوید «از این لحظه به قبل».
//
// یکتاسازی بر اساس owner_id در همین دسته انجام می‌شود (هم‌الگو با تابع صفحه‌ی اصلی). چون
// یکتاسازیِ بین‌دسته‌ای اینجا ممکن نیست (سرور نمی‌داند کلاینت قبلاً چه دیده)، خودِ کلاینت هم
// هنگام چسباندن دسته‌ی تازه یک‌بار دیگر بر اساس ownerId یکتاسازی می‌کند — رجوع کنید به
// src/app/[lang]/stories/AllStoriesClient.tsx.
export type StoriesPage = {
  items: HomeStoryPreview[];
  // مقداری که برای گرفتن دسته‌ی بعدی باید دوباره پاس داده شود. null یعنی دیگر چیزی نمانده.
  nextCursor: string | null;
};

export async function fetchStoriesPage(
  limit: number,
  cursor: string | null
): Promise<StoriesPage> {
  // استوریِ رسمی فقط در همان اولین صفحه (cursor===null) سنجاق می‌شود — نه در هر صفحه‌ی
  // بعدی، چون «سنجاق در صدر» یک مفهومِ یک‌بارِ کلِ فهرست است، نه چیزی که هر صفحه باید تکرار
  // کند. اگر همین صاحب دوباره (طبق نوبتِ عادیِ created_at) در یکی از صفحات بعدی هم ظاهر شود،
  // یکتاسازیِ سمت کلاینت (AllStoriesClient.tsx، بر اساس ownerId بین کل صفحات) به‌طور طبیعی
  // جلوی تکراری‌شدنش را می‌گیرد؛ پس نیازی به منطق مستثناسازیِ اضافه در صفحات بعدی نیست.
  let officialStory: HomeStoryPreview | null = null;
  if (cursor === null) {
    const adminId = await getOfficialAdminId();
    officialStory = adminId ? await fetchOfficialStoryPreview(adminId) : null;
  }

  const remainingLimit = officialStory ? Math.max(limit - 1, 0) : limit;

  const nowIso = new Date().toISOString();
  // مثل تابع صفحه‌ی اصلی، عمداً بیشتر از حد نیاز خوانده می‌شود چون بعد از یکتاسازی بر اساس
  // صاحب استوری، تعداد ردیف‌های مفید کمتر از تعداد ردیف‌های خام است.
  const fetchBatchSize = Math.max(limit * 6, 60);

  let query = supabaseAdminClient
    .from("stories")
    .select("id, owner_id, media_type, media_path, created_at")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(fetchBatchSize);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return officialStory
      ? { items: [officialStory], nextCursor: null }
      : { items: [], nextCursor: null };
  }

  const seenOwners = new Set<string>(officialStory ? [officialStory.ownerId] : []);
  const latestPerOwner: typeof data = [];
  let lastConsumedCreatedAt: string | null = null;

  // remainingLimit فقط وقتی صفر می‌شود که صفحه‌بندی با اندازه‌ی صفحه‌ی ۱ صدا زده شده باشد و
  // استوریِ رسمی هم پین شده باشد — چیزی که در عمل هرگز رخ نمی‌دهد (STORIES_PAGE_SIZE=۱۲)، اما
  // برای درستیِ کامل، در آن حالت این حلقه اصلاً چیزی مصرف نمی‌کند.
  if (remainingLimit > 0) {
    for (const row of data) {
      lastConsumedCreatedAt = row.created_at as string;
      const ownerId = row.owner_id as string;
      if (seenOwners.has(ownerId)) continue;
      seenOwners.add(ownerId);
      latestPerOwner.push(row);
      if (latestPerOwner.length >= remainingLimit) break;
    }
  }

  // اگر دسته‌ی خام کوچک‌تر از سقفِ درخواستی بود، یعنی به انتهای واقعی جدول رسیده‌ایم و دیگر
  // صفحه‌ی بعدی وجود ندارد.
  const reachedEnd = data.length < fetchBatchSize;
  const nextCursor = reachedEnd ? null : lastConsumedCreatedAt;

  if (latestPerOwner.length === 0) {
    return officialStory
      ? { items: [officialStory], nextCursor }
      : { items: [], nextCursor };
  }

  const ownerIds = latestPerOwner.map((row) => row.owner_id as string);
  const { data: owners } = await supabaseAdminClient
    .from("users")
    .select("id, name")
    .in("id", ownerIds);
  const ownerById = new Map((owners ?? []).map((o) => [o.id as string, o]));

  const rest: HomeStoryPreview[] = latestPerOwner.map((row) => ({
    storyId: row.id as string,
    ownerId: row.owner_id as string,
    ownerName: ownerById.get(row.owner_id as string)?.name ?? null,
    mediaType: row.media_type as StoryMediaType,
    mediaUrl: getStoryMediaUrl(row.media_path as string),
    createdAt: row.created_at as string,
    isOfficial: false,
  }));

  const items = officialStory ? [officialStory, ...rest] : rest;

  return { items, nextCursor };
}

// بدون کش در همین فایل — کش (unstable_cache، ۳ دقیقه‌ای) دقیقاً هم‌الگو با بقیه‌ی بخش‌های صفحه‌ی
// اصلی در src/lib/home/homeQueries.ts اعمال می‌شود، نه اینجا؛ این فایل فقط لایه‌ی خواندن خام است.
export { fetchLatestStoriesForHome };