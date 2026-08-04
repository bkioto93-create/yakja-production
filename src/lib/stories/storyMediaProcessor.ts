// مسیر فایل: src/lib/stories/storyMediaProcessor.ts
// قابلیت استوری — فشرده‌سازی رسانه سمت کلاینت، پیش از آپلود.
//
// **چرا همه‌چیز سمت مرورگر انجام می‌شود، نه سرور:** پروژه روی Vercel Hobby است (سقف اجرای هر
// تابع سرورلس فقط ۱۰ ثانیه) و صریحاً برای اینترنت ۲G/۳G بهینه شده (رجوع کنید به یادداشت بالای
// src/lib/marketplace/imageCompression.ts). یک کتابخانه‌ی رمزگذاری ویدئوی واقعی مثل ffmpeg.wasm
// حدود ۲۵ مگابایت دانلود اضافه می‌کند — دقیقاً نقطه‌مقابل همان فلسفه‌ی «سبک برای اینترنت ضعیف».
// به‌جایش از دو API بومی و رایگانِ خودِ مرورگر استفاده می‌شود: Canvas (برای تغییر رزولوشن هر
// فریم) + MediaRecorder (برای رمزگذاری واقعیِ فریم‌های کشیده‌شده به یک ویدئوی تازه و کوچک‌تر).
// صفر بایت دانلود اضافه.
//
// **محدودیت شناخته‌شده (باید به کارفرما گفته شود):** خروجی MediaRecorder به فرمت mp4 یا webm
// بستگی به پشتیبانی مرورگر کاربر دارد (کد پایین اول mp4 را امتحان می‌کند، چون سافاری/آیفون فقط
// mp4 را ضبط می‌کند؛ کروم/اندروید معمولاً فقط webm). یعنی اگر یک کاربر اندرویدی استوری بگذارد،
// فایل نهایی webm است — که روی آیفون/سافاری در برخی نسخه‌ها ممکن است پخش نشود. این یک مصالحه‌ی
// آگاهانه است (نه یک باگ فراموش‌شده)، دقیقاً به‌خاطر هزینه‌ی دانلود ffmpeg.wasm که با فلسفه‌ی
// «سبک برای ۲G/۳G» پروژه در تضاد بود.
//
// این فایل فقط سمت مرورگر اجرا می‌شود (Canvas/MediaRecorder API) — هرگز داخل Server Action یا
// هر فایل سروری import نشود؛ دقیقاً همان قاعده‌ی src/lib/marketplace/imageCompression.ts.
"use client";

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

// ---------------------------------------------------------------------------
// ویدئو — پارامترهای فشرده‌سازی. همه‌ی این اعداد در یک‌جا نگه داشته شده‌اند تا اگر کارفرما بعداً
// خواست «کیفیت بهتر با حجم بیشتر» یا برعکس، تغییرش ساده و یک‌جا باشد.
// ---------------------------------------------------------------------------
export const STORY_VIDEO_MAX_DURATION_SECONDS = 15;
const VIDEO_MAX_DIMENSION_PX = 720;
const VIDEO_TARGET_MAX_BYTES = 3 * 1024 * 1024; // ۳ مگابایت هدف
// چون bitrate هدف یک تخمین است نه یک تضمین دقیق (رمزگذارهای واقعی مرورگر معمولاً کمی نوسان
// دارند)، یک سقف مطلق با کمی تلورانس (۲۰٪) بعد از ضبط دوباره بررسی می‌شود.
const VIDEO_HARD_CAP_BYTES = Math.round(VIDEO_TARGET_MAX_BYTES * 1.2);
const VIDEO_AUDIO_BITRATE_BPS = 96_000;
const VIDEO_MIN_BITRATE_BPS = 300_000;
const VIDEO_MAX_BITRATE_BPS = 2_500_000;
const VIDEO_CAPTURE_FPS = 24;
// سقف حفاظتی روی حجم فایل خامِ ورودی (پیش از فشرده‌سازی) — صرفاً برای جلوگیری از تلاش برای
// پردازش یک فایل غیرمنطقی‌بزرگ در مرورگر گوشی؛ عدد کاملاً سخاوتمندانه است (بیشتر ویدئوهای
// موبایل حتی در ۴K برای چند ده ثانیه از این کمتر است).
const MAX_SOURCE_VIDEO_BYTES = 300 * 1024 * 1024;

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
// ویدئو
// ---------------------------------------------------------------------------

// آیا مرورگر جاری اصلاً امکان فشرده‌سازی ویدئو را دارد؟ (Canvas.captureStream + MediaRecorder).
// این تابع قبل از نشان‌دادن دکمه‌ی «انتخاب ویدئو» در UI صدا زده می‌شود — اگر false برگرداند،
// رابط کاربری فقط گزینه‌ی «انتخاب عکس» را نشان می‌دهد، نه یک خطای رمزگذاریِ غافلگیرکننده بعد از
// انتخاب فایل.
export function isVideoCompressionSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const canvas = document.createElement("canvas");
  return typeof (canvas as HTMLCanvasElement & { captureStream?: unknown }).captureStream === "function";
}

function pickSupportedVideoMimeType(): string {
  // اولویت با mp4 (H.264/AAC) است — چون سافاری/آیفون فقط این را ضبط می‌کند و همه‌جا هم قابل
  // پخش است؛ اگر مرورگر (مثل کروم/اندروید) mp4 را پشتیبانی نکرد، به webm برمی‌گردیم.
  const candidates = [
    "video/mp4;codecs=h264,aac",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  // اگر هیچ‌کدام صریحاً پشتیبانی نشد، رشته‌ی خالی یعنی «بگذار خودِ مرورگر پیش‌فرضش را انتخاب
  // کند» — رفتار استاندارد MediaRecorder وقتی mimeType داده نشود.
  return "";
}

function loadVideoElement(file: File): Promise<{ video: HTMLVideoElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    // بی‌صداکردن پخشِ داخلیِ عنصر <video> در حین پردازش، تا کاربر یک صدای ناخواسته حین دیدن
    // اسپینر «در حال آماده‌سازی» نشنود. این کار track صدای captureStream را خاموش نمی‌کند —
    // آن جدا و مستقل ضبط می‌شود.
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => resolve({ video, objectUrl });
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("videoUnreadable"));
    };
    video.src = objectUrl;
  });
}

function computeOutputDimensions(sourceWidth: number, sourceHeight: number): { width: number; height: number } {
  let width = sourceWidth || VIDEO_MAX_DIMENSION_PX;
  let height = sourceHeight || VIDEO_MAX_DIMENSION_PX;
  const longestEdge = Math.max(width, height);

  if (longestEdge > VIDEO_MAX_DIMENSION_PX) {
    const scale = VIDEO_MAX_DIMENSION_PX / longestEdge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // برخی رمزگذارها (به‌خصوص H.264) فقط ابعاد زوج را می‌پذیرند.
  width = width - (width % 2);
  height = height - (height % 2);

  return { width: Math.max(2, width), height: Math.max(2, height) };
}

// محاسبه‌ی bitrate هدف ویدئو، بر اساس مدت‌زمان واقعی و این‌که صدا دارد یا نه — تا مجموع
// (صدا+تصویر) روی کل مدت‌زمان تقریباً به VIDEO_TARGET_MAX_BYTES برسد. کلیپ کوتاه‌تر خودکار
// bitrate بالاتر (کیفیت بهتر) می‌گیرد، چون همان بودجه‌ی بایت را روی زمان کمتری پخش می‌کند.
function computeVideoBitrate(effectiveDurationSeconds: number, hasAudio: boolean): number {
  const audioBits = hasAudio ? VIDEO_AUDIO_BITRATE_BPS * effectiveDurationSeconds : 0;
  const totalTargetBits = VIDEO_TARGET_MAX_BYTES * 8;
  const videoBits = Math.max(0, totalTargetBits - audioBits);
  const bitrate = Math.round(videoBits / effectiveDurationSeconds);
  return Math.min(VIDEO_MAX_BITRATE_BPS, Math.max(VIDEO_MIN_BITRATE_BPS, bitrate));
}

// نوع کمکی برای دسترسی امن (بدون any) به دو متد نسبتاً تازه‌ی مرورگر که همیشه در تمام نسخه‌های
// lib.dom.d.ts تعریف نشده‌اند: HTMLCanvasElement.captureStream و
// HTMLVideoElement.requestVideoFrameCallback.
type CaptureCapableCanvas = HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream };
type CaptureCapableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  requestVideoFrameCallback?: (callback: () => void) => number;
};

// فشرده‌سازی واقعی ویدئو: فایل منبع را در یک عنصر <video> پنهان پخش می‌کند، هر فریم را روی یک
// canvas با رزولوشن کاهش‌یافته می‌کشد، و همان canvas را با MediaRecorder به یک ویدئوی تازه و
// کوچک رمزگذاری می‌کند — حداکثر تا STORY_VIDEO_MAX_DURATION_SECONDS ثانیه (اگر ویدئوی اصلی
// طولانی‌تر بود، فقط همان چند ثانیه‌ی اول استفاده می‌شود؛ UI باید این را پیشاپیش به کاربر بگوید).
export async function compressStoryVideo(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<CompressedStoryMedia> {
  if (!isVideoCompressionSupported()) {
    throw new Error("videoRecordingUnsupported");
  }
  if (file.size > MAX_SOURCE_VIDEO_BYTES) {
    throw new Error("videoFileTooLarge");
  }

  const { video, objectUrl } = await loadVideoElement(file);

  try {
    const sourceDuration = Number.isFinite(video.duration) ? video.duration : 0;
    if (!sourceDuration || sourceDuration <= 0) {
      throw new Error("videoUnreadable");
    }

    const effectiveDuration = Math.min(sourceDuration, STORY_VIDEO_MAX_DURATION_SECONDS);
    const { width, height } = computeOutputDimensions(video.videoWidth, video.videoHeight);

    const canvas = document.createElement("canvas") as CaptureCapableCanvas;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvasContextUnavailable");

    const captureVideo = video as CaptureCapableVideo;
    const sourceStream = captureVideo.captureStream?.();
    const audioTracks = sourceStream?.getAudioTracks() ?? [];

    const canvasStream = canvas.captureStream(VIDEO_CAPTURE_FPS);
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

    const mimeType = pickSupportedVideoMimeType();
    const videoBitsPerSecond = computeVideoBitrate(effectiveDuration, audioTracks.length > 0);
    const recorderOptions: MediaRecorderOptions = { videoBitsPerSecond };
    if (mimeType) recorderOptions.mimeType = mimeType;

    const recorder = new MediaRecorder(combinedStream, recorderOptions);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    const stopAllTracks = () => {
      combinedStream.getTracks().forEach((track) => track.stop());
      sourceStream?.getTracks().forEach((track) => track.stop());
    };

    const recordingDone = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const outputType = (mimeType.split(";")[0] || "video/webm") as string;
        resolve(new Blob(chunks, { type: outputType }));
      };
      recorder.onerror = () => reject(new Error("videoCompressionFailed"));
    });

    await video.play();
    // فریم اول را قبل از شروع ضبط می‌کشیم تا اولین لحظه‌ی خروجی خالی/سیاه نباشد.
    context.drawImage(video, 0, 0, width, height);
    recorder.start();

    let stopped = false;
    const startTime = performance.now();

    function drawFrame() {
      if (stopped) return;
      const elapsedSeconds = (performance.now() - startTime) / 1000;

      if (elapsedSeconds >= effectiveDuration || video.ended) {
        stopped = true;
        video.pause();
        recorder.stop();
        return;
      }

      context!.drawImage(video, 0, 0, width, height);
      onProgress?.(Math.min(1, elapsedSeconds / effectiveDuration));

      if (captureVideo.requestVideoFrameCallback) {
        captureVideo.requestVideoFrameCallback(drawFrame);
      } else {
        requestAnimationFrame(drawFrame);
      }
    }

    if (captureVideo.requestVideoFrameCallback) {
      captureVideo.requestVideoFrameCallback(drawFrame);
    } else {
      requestAnimationFrame(drawFrame);
    }

    let blob: Blob;
    try {
      blob = await recordingDone;
    } finally {
      stopAllTracks();
    }

    if (blob.size === 0) throw new Error("videoCompressionFailed");
    if (blob.size > VIDEO_HARD_CAP_BYTES) throw new Error("videoTooLargeAfterCompression");

    onProgress?.(1);

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      sizeBytes: blob.size,
      mediaType: "video",
      mimeType: blob.type,
      width,
      height,
      durationSeconds: Math.round(effectiveDuration * 10) / 10,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ---------------------------------------------------------------------------
// نقطه‌ی ورود واحد — تشخیص نوع فایل و فراخوانی تابع مناسب. کامپوننت UI فقط همین یک تابع را صدا
// می‌زند، نیازی به دانستن این‌که عکس/ویدئو داخلاً چطور پردازش می‌شوند نیست.
// ---------------------------------------------------------------------------
export async function processStoryMedia(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<CompressedStoryMedia> {
  if (file.type.startsWith("image/")) {
    return compressStoryImage(file);
  }
  if (file.type.startsWith("video/")) {
    return compressStoryVideo(file, onProgress);
  }
  throw new Error("unsupportedFileType");
}