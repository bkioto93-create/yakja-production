// مسیر فایل: src/lib/stories/storyMediaProcessor.ts
// قابلیت استوری — فشرده‌سازی رسانه سمت کلاینت، پیش از آپلود.
//
// **به‌روزرسانی (رفع باگ «ویدئوی آگهی VIP فشرده نمی‌شد»):** موتور فشرده‌سازی ویدئو که ابتدا فقط
// همین‌جا (برای استوری) نوشته شده بود، به یک ماژول عمومی و قابل‌تنظیم منتقل شد
// (src/lib/media/videoCompression.ts) — چون همان منطق دقیقاً برای ویدئوی آگهی VIP هم لازم بود.
// این فایل الان فقط پارامترهای مخصوص استوری (مدت‌زمان، رزولوشن، حجم هدف) را تعریف می‌کند و همان
// موتور مشترک را صدا می‌زند؛ خودِ منطق پیچیده‌ی Canvas+MediaRecorder دیگر اینجا تکرار نشده.
//
// عکس همچنان دقیقاً هم‌الگو با src/lib/marketplace/imageCompression.ts (کاهش پلکانی کیفیت JPEG)
// مستقیم همین‌جا پیاده‌سازی شده — چون فقط چند خط است و منطق مشترکی با ویدئو ندارد.
//
// **به‌روزرسانی (سقفِ VIP برای ویدئوی استوری):** طبق تصمیم صریح کارفرما، کاربرِ VIP حالا
// می‌تواند تا ۳۰ ثانیه (به‌جای ۱۵ ثانیه) ویدئوی استوری بگذارد. سقفِ ثابتِ قبلی
// (STORY_VIDEO_MAX_DURATION_SECONDS) از این فایل حذف و به یک منبعِ حقیقتِ مشترک منتقل شد
// (src/lib/stories/storyVideoLimits.ts، قابل‌استفاده هم اینجا هم سمتِ سرور در
// storyActions.ts) — تابعِ getStoryVideoMaxDurationSeconds(isVip) حالا سقفِ درست را برمی‌گرداند.
// حجمِ هدفِ فشرده‌سازی (targetMaxBytes) هم دیگر یک عددِ ثابت نیست؛ بر اساسِ همان نرخِ قبلیِ
// «هر ثانیه چقدر حجم» محاسبه می‌شود، تا ویدئوی ۳۰ثانیه‌ایِ VIP هم کیفیتِ مشابهِ ویدئوی ۱۵ثانیه‌ای
// را حفظ کند (نه این‌که با همان سقفِ حجمِ قبلی در نصفِ نرخِ بیت فشرده شود).
//
// این فایل فقط سمت مرورگر اجرا می‌شود — هرگز داخل Server Action یا هر فایل سروری import نشود.
"use client";

import { compressVideoFile, isVideoCompressionSupported } from "@/lib/media/videoCompression";
import { getStoryVideoMaxDurationSeconds } from "@/lib/stories/storyVideoLimits";
export { isVideoCompressionSupported };
export { getStoryVideoMaxDurationSeconds };

// ---------------------------------------------------------------------------
// عکس — دقیقاً هم‌الگو با src/lib/marketplace/imageCompression.ts (کاهش پلکانی کیفیت JPEG)،
// فقط با سقف‌های مخصوص استوری: چون استوری تمام‌صفحه دیده می‌شود (نه یک عکس کوچک در گالری آگهی)،
// رزولوشن هدف کمی بالاتر (۱۰۸۰ به‌جای ۱۲۸۰... در واقع نزدیک، فقط برای وضوح تمام‌صفحه) و سقف حجم
// کمی بیشتر (۳۰۰ کیلوبایت به‌جای ۲۵۰) در نظر گرفته شده.
// ---------------------------------------------------------------------------
const IMAGE_MAX_DIMENSION_PX = 1080;
const IMAGE_TARGET_MAX_BYTES = 300 * 1024;
const IMAGE_MIN_QUALITY = 0.45;
const IMAGE_QUALITY_STEP = 0.07;
const IMAGE_INITIAL_QUALITY = 0.82;

// مدت‌نمایش ثابت هر استوریِ عکس در Viewer (ثانیه) — چون عکس بر خلاف ویدئو مدت‌زمان ذاتی ندارد.
export const STORY_IMAGE_DISPLAY_SECONDS = 6;

export type CompressedStoryMedia = {
  blob: Blob;
  previewUrl: string;
  sizeBytes: number;
  mediaType: "image" | "video";
  mimeType: string;
  width: number;
  height: number;
  // فقط برای ویدئو مقدار دارد؛ برای عکس همیشه null (نمایش عکس مدت‌زمان ثابت
  // STORY_IMAGE_DISPLAY_SECONDS دارد که در Viewer اعمال می‌شود، نه اینجا).
  durationSeconds: number | null;
};

function loadImageElement(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("imageUnreadable"));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("imageConversionFailed"))),
      "image/jpeg",
      quality
    );
  });
}

export async function compressStoryImage(file: File): Promise<CompressedStoryMedia> {
  const { img, objectUrl } = await loadImageElement(file);

  let { width, height } = img;
  if (width > height && width > IMAGE_MAX_DIMENSION_PX) {
    height = Math.round((height * IMAGE_MAX_DIMENSION_PX) / width);
    width = IMAGE_MAX_DIMENSION_PX;
  } else if (height >= width && height > IMAGE_MAX_DIMENSION_PX) {
    width = Math.round((width * IMAGE_MAX_DIMENSION_PX) / height);
    height = IMAGE_MAX_DIMENSION_PX;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvasContextUnavailable");
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(objectUrl);

  let quality = IMAGE_INITIAL_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > IMAGE_TARGET_MAX_BYTES && quality > IMAGE_MIN_QUALITY) {
    quality = Math.max(IMAGE_MIN_QUALITY, quality - IMAGE_QUALITY_STEP);
    blob = await canvasToBlob(canvas, quality);
  }

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    sizeBytes: blob.size,
    mediaType: "image",
    mimeType: "image/jpeg",
    width,
    height,
    durationSeconds: null,
  };
}

// ---------------------------------------------------------------------------
// ویدئو — پارامترهای مخصوص استوری، پاس داده‌شده به موتور مشترک
// (src/lib/media/videoCompression.ts). سقفِ مدت‌زمان دیگر یک عددِ ثابت نیست؛ از
// storyVideoLimits.ts خوانده می‌شود (۱۵ ثانیه کاربر معمولی، ۳۰ ثانیه کاربر VIP).
// ---------------------------------------------------------------------------
const VIDEO_MAX_DIMENSION_PX = 720;
// نرخِ حجمِ هدف «به‌ازای هر ثانیه» — همان نرخِ قبلیِ ثابتِ پروژه (۳ مگابایت برای ۱۵ ثانیه)، فقط
// حالا به یک نرخِ ثانیه‌ای تبدیل شده تا با هر سقفِ مدت‌زمانی (۱۵ یا ۳۰ ثانیه) به‌درستی مقیاس شود؛
// یعنی ویدئوی ۳۰ثانیه‌ایِ VIP هدفِ حجمِ حدوداً ۶ مگابایتی می‌گیرد، نه همان ۳ مگابایتِ قبلی که در
// نصفِ نرخِ بیتِ سابق فشرده و کیفیتش افت می‌کرد.
const VIDEO_TARGET_BYTES_PER_SECOND = (3 * 1024 * 1024) / 15;

// فشرده‌سازی ویدئوی استوری: فقط یک پوسته‌ی نازک دور compressVideoFile مشترک، با پارامترهای
// مخصوص استوری (سقفِ مدت‌زمانِ متناسب با VIP بودنِ کاربر، حداکثر ۷۲۰px، هدفِ حجمِ متناسب با همان
// سقفِ مدت‌زمان). اگر ویدئوی منبع طولانی‌تر از سقف بود، فقط همان چند ثانیه‌ی اول استفاده
// می‌شود؛ UI باید این را پیشاپیش به کاربر بگوید.
export async function compressStoryVideo(
  file: File,
  isVip: boolean,
  onProgress?: (ratio: number) => void
): Promise<CompressedStoryMedia> {
  const maxDurationSeconds = getStoryVideoMaxDurationSeconds(isVip);
  const targetMaxBytes = Math.round(VIDEO_TARGET_BYTES_PER_SECOND * maxDurationSeconds);

  const result = await compressVideoFile(
    file,
    {
      maxDurationSeconds,
      maxDimensionPx: VIDEO_MAX_DIMENSION_PX,
      targetMaxBytes,
    },
    onProgress
  );

  return {
    blob: result.blob,
    previewUrl: result.previewUrl,
    sizeBytes: result.sizeBytes,
    mediaType: "video",
    mimeType: result.mimeType,
    width: result.width,
    height: result.height,
    durationSeconds: result.durationSeconds,
  };
}

// ---------------------------------------------------------------------------
// نقطه‌ی ورود واحد — تشخیص نوع فایل و فراخوانی تابع مناسب. کامپوننت UI فقط همین یک تابع را صدا
// می‌زند، نیازی به دانستن این‌که عکس/ویدئو داخلاً چطور پردازش می‌شوند نیست. پارامترِ isVip فقط
// برای ویدئو معنا دارد (تعیینِ سقفِ مدت‌زمان)؛ برای عکس نادیده گرفته می‌شود.
// ---------------------------------------------------------------------------
export async function processStoryMedia(
  file: File,
  isVip: boolean,
  onProgress?: (ratio: number) => void
): Promise<CompressedStoryMedia> {
  if (file.type.startsWith("image/")) {
    return compressStoryImage(file);
  }
  if (file.type.startsWith("video/")) {
    return compressStoryVideo(file, isVip, onProgress);
  }
  throw new Error("unsupportedFileType");
}