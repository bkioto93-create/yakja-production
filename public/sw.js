// مسیر فایل: public/sw.js
// تسک ۲ فاز ۰۸ — Service Worker برای کش کردن صفحات/آگهی‌های قبلاً بازدیدشده جهت نمایش فوری در
// بازدید مجدد، بدون نیاز به دانلود دوباره (بند ۵.۳ و بند ۶.۱۲ سند راهبردی: بهینه‌سازی برای
// اینترنت ۲G/۳G و گوشی‌های ارزان‌قیمت رایج در افغانستان).
//
// این فایل عمداً بدون هیچ کتابخانه‌ی ثالثی (بدون Workbox/next-pwa) نوشته شده — دقیقاً هم‌راستا
// با فلسفه‌ی بقیه‌ی پروژه (هر جا منطق ساده است، به‌جای افزودن یک وابستگی تازه، دستی نوشته می‌شود).
//
// === استراتژی کش (۳ کش جداگانه، هرکدام یک قاعده‌ی متفاوت) ===
// ۱) PAGES  — سند HTML صفحاتی که قبلاً بازدید شده‌اند: «Network-First با سقف زمانی ۳ ثانیه»
//    (به‌روزرسانی؛ دلیل تغییر از نسخه‌ی قبلی Stale-While-Revalidate را در یادداشت پایین‌تر
//    کنار CACHE_VERSION بخوانید). صفحاتِ خصوصی/فرم (پنل ادمین، فرم پروفایل راننده/متخصص،
//    فرم ثبت آگهی/ملک) عمداً از این کش مستثنا شده‌اند (تابع isCacheableNavigation پایین) — چون
//    این‌ها یا اطلاعات لحظه‌ای/حساس دارند یا فرم نیمه‌پرشده که کش‌کردنشان می‌تواند گمراه‌کننده باشد.
// ۲) STATIC — فایل‌های بیلد Next.js زیر /_next/static/... : نام‌فایل‌ها حاوی هش محتوا هستند
//    (تغییرناپذیر/Immutable)، پس «Cache-First» کاملاً امن است — هرگز نیازی به شبکه دوباره نیست.
// ۳) IMAGES — تصاویر آگهی/راننده/متخصص/املاک که از باکت‌های Storage سوپابیس (دامنه‌ی دیگر) بارگذاری
//    می‌شوند: مسیر هر فایل شامل timestamp آپلود است (عملاً یکتا و تغییرناپذیر)، پس اینجا هم
//    «Cache-First» امن است؛ یک سقف تعداد ورودی (MAX_IMAGE_ENTRIES) با حذف قدیمی‌ترین‌ها (FIFO)
//    از پر شدن بی‌رویه‌ی حافظه‌ی گوشی‌های ارزان‌قیمت جلوگیری می‌کند.
//
// درخواست‌های POST/Server Action، مسیرهای /api/*، و هرگونه متد غیر GET هرگز کش نمی‌شوند — این‌ها
// همیشه باید مستقیم و تازه از سرور باشند.

// === رفع باگ «PWA نصب‌شده نسخه‌ی قدیمی/کش‌شده را نشان می‌دهد تا رفرش دستی» ===
// علت دقیق: استراتژی قبلی («Stale-While-Revalidate») برای صفحات، عمداً همیشه نسخه‌ی کش‌شده را
// فوراً نمایش می‌داد و آپدیت را فقط در پس‌زمینه برای «بازدید بعدی» ذخیره می‌کرد — یعنی کاربر
// همیشه یک قدم عقب‌تر از آخرین نسخه‌ی واقعی می‌ماند؛ دقیقاً همان چیزی که گزارش کردید. حالا
// استراتژی ناوبری صفحات به «Network-First با سقف زمانی» تغییر کرده: ابتدا حداکثر ۳ ثانیه صبر
// می‌کند تا نسخه‌ی تازه از شبکه برسد (در بیشتر موارد، حتی با اینترنت متوسط، سریع‌تر از این
// می‌رسد) و همان را نشان می‌دهد؛ فقط اگر شبکه واقعاً کند/قطع باشد (دقیقاً سناریوی اینترنت
// ضعیف/آفلاین که هدف اصلی این Service Worker است)، به‌جای معطل ماندن، فوراً از کش نمایش می‌دهد.
// یعنی همان مزیت قبلی (سرعت در اینترنت بد) حفظ شده، ولی وقتی اینترنت طبیعی است، همیشه آخرین
// نسخه دیده می‌شود، نه نسخه‌ی یک‌قدم-عقب‌تر.
//
// نکته‌ی دوم و به‌همان‌اندازه مهم: مرورگر برای تشخیص «آیا Service Worker تازه‌ای منتشر شده؟» باید
// بتواند خودِ فایل sw.js را بدون کش قدیمی بخواند. اگر هاست (Vercel) این فایل را با هدر کشِ طولانی
// سرو کند، مرورگر ممکن است مدتی همان نسخه‌ی قدیمیِ sw.js را «تازه» فرض کند و اصلاً متوجه انتشار
// نسخه‌ی جدید نشود. برای همین، در کنار این فایل، به next.config.ts هم یک بخش headers() اضافه شد
// که صریحاً Cache-Control: no-cache را برای مسیر /sw.js تنظیم می‌کند.
const CACHE_VERSION = "v2";
const PAGES_CACHE = `yakja-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `yakja-static-${CACHE_VERSION}`;
const IMAGES_CACHE = `yakja-images-${CACHE_VERSION}`;
const OFFLINE_CACHE = `yakja-offline-${CACHE_VERSION}`;
const ALL_CACHES = [PAGES_CACHE, STATIC_CACHE, IMAGES_CACHE, OFFLINE_CACHE];

const OFFLINE_URL = "/offline.html";
const MAX_IMAGE_ENTRIES = 120;

// مسیرهایی که هرگز نباید به‌عنوان «صفحه» کش شوند — دقیقاً چون یا خصوصی/فرم‌محورند یا لحظه‌ای.
// (بررسی روی pathname انجام می‌شود، یعنی هر دو زبان fa/ps را همزمان پوشش می‌دهد، چون هر دو زیر
// همان الگوی /{lang}/transport/driver و... هستند.)
const NON_CACHEABLE_PATH_SEGMENTS = [
  "/admin",
  "/transport/driver",
  "/services/provider",
  "/listings/new",
  "/real-estate/new",
  "/select-language",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      // اگر پیش‌بارگذاری offline.html به هر دلیلی شکست بخورد (مثلاً بیلد اول)، نصب Service
      // Worker نباید کامل شکست بخورد — بقیه‌ی کش‌ها همچنان کار می‌کنند.
      try {
        await cache.add(OFFLINE_URL);
      } catch {
        // نادیده گرفته می‌شود؛ در بدترین حالت صفحه‌ی آفلاین سفارشی نداریم، نه اینکه کل SW از کار بیفتد.
      }
      // فعال‌سازی فوری نسخه‌ی تازه به‌جای منتظرماندن تا بسته‌شدن همه‌ی تب‌های باز — بند ۶.۱۲.
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // پاک‌سازی نسخه‌های قبلی کش (هر بار که CACHE_VERSION بالا افزایش یابد، کش‌های قدیمی حذف
      // می‌شوند تا حافظه‌ی گوشی هدر نرود).
      const existingCacheNames = await caches.keys();
      await Promise.all(
        existingCacheNames
          .filter((name) => name.startsWith("yakja-") && !ALL_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isCacheableNavigation(url) {
  return !NON_CACHEABLE_PATH_SEGMENTS.some((segment) => url.pathname.includes(segment));
}

function isNextStaticAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
}

function isSupabaseStorageImage(url) {
  // باکت‌های عمومی تصاویر همیشه زیر همین مسیر ثابت Supabase Storage هستند، مستقل از این‌که کدام
  // پروژه/دامنه باشد؛ محدودکردن به «object/public» یعنی هرگز آدرس امضاشده‌ی موقت (که خودش دارای
  // Token است و نباید کش شود) اشتباهی کش نمی‌شود.
  return url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/public/");
}

// حذف قدیمی‌ترین ورودی‌ها اگر تعداد از سقف مجاز بیشتر شد — ساده‌ترین شکل FIFO، بدون نیاز به
// ثبت جداگانه‌ی زمان دسترسی (که خودش هزینه‌ی حافظه/پیچیدگی اضافه می‌کرد).
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const overflow = keys.length - maxEntries;
  for (let i = 0; i < overflow; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request, cacheName, { trimTo } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // فقط پاسخ‌های موفق (یا opaque برای تصاویر cross-origin که وضعیت‌شان از جاوااسکریپت قابل
    // خواندن نیست) کش می‌شوند.
    if (response && (response.ok || response.type === "opaque")) {
      await cache.put(request, response.clone());
      if (trimTo) await trimCache(cacheName, trimTo);
    }
    return response;
  } catch (err) {
    // هیچ نسخه‌ی کش‌شده‌ای نبود و شبکه هم در دسترس نیست — برای تصاویر/فایل استاتیک چیزی برای
    // بازگرداندن نداریم؛ خطا را دوباره پرتاب می‌کنیم تا مرورگر رفتار پیش‌فرض خودش را نشان دهد.
    throw err;
  }
}

const NAVIGATION_NETWORK_TIMEOUT_MS = 3000;

async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGES_CACHE);

  try {
    // مسابقه‌ی شبکه در برابر یک تایمر ۳ ثانیه‌ای: هرکدام زودتر جواب داد، همان استفاده می‌شود.
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("network-timeout")), NAVIGATION_NETWORK_TIMEOUT_MS);
      }),
    ]);

    if (networkResponse && networkResponse.ok) {
      // نسخه‌ی تازه با موفقیت رسید — هم همین را نشان بده، هم کش را برای بار بعد (وقتی احتمالاً
      // آفلاین/کندی است) به‌روزرسانی کن.
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // پاسخ شبکه ناموفق بود (مثلاً ۵۰۰) — اگر کش داریم نشانش بده، وگرنه همان پاسخ ناموفق را برگردان.
    const cached = await cache.match(request);
    return cached ?? networkResponse;
  } catch {
    // شبکه یا خیلی کند بود (تایم‌اوت) یا اصلاً در دسترس نبود — همان‌جا که این Service Worker
    // برای‌اش ساخته شده: فوراً از کش نشان بده تا کاربر معطل نماند.
    const cached = await cache.match(request);
    if (cached) return cached;

    const offlineCache = await caches.open(OFFLINE_CACHE);
    const offlineResponse = await offlineCache.match(OFFLINE_URL);
    return (
      offlineResponse ??
      new Response("آفلاین هستید و این صفحه پیش‌تر بازدید نشده است.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // فقط GET؛ Server Actionها (POST) و هر متد دیگری همیشه مستقیم به شبکه می‌روند.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // مسیرهای /api/* (مانیفست پویا، Health Check، Cron، بک‌آپ ادمین) همیشه تازه و مستقیم از سرور.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) return;

  // ۱) ناوبری بین صفحات (بارگذاری کامل سند HTML)
  if (request.mode === "navigate") {
    if (!isCacheableNavigation(url)) return; // اجازه بده مرورگر خودش مستقیم به شبکه برود
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // ۲) فایل‌های استاتیک بیلد Next.js — تغییرناپذیر، Cache-First
  if (isNextStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ۳) تصاویر عمومی باکت‌های Supabase Storage — عملاً تغییرناپذیر (نام فایل = timestamp)، Cache-First
  if (isSupabaseStorageImage(url)) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, { trimTo: MAX_IMAGE_ENTRIES }));
    return;
  }

  // بقیه‌ی درخواست‌ها (فونت گوگل، درخواست‌های RPC/REST سوپابیس، وب‌سوکت Realtime و...) دست‌نخورده
  // می‌مانند — این Service Worker عمداً فقط دامنه‌ی مشخص‌شده‌ی تسک ۲ را پوشش می‌دهد.
});