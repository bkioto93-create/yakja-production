// مسیر فایل: src/lib/media/videoCompression.ts
// موتور عمومیِ فشرده‌سازی ویدئو سمت مرورگر — استخراج‌شده از موتوری که ابتدا برای قابلیت استوری
// ساخته شد (src/lib/stories/storyMediaProcessor.ts)، چون همان منطق دقیقاً برای ویدئوی آگهی VIP
// هم لازم شد (رجوع کنید به یادداشت src/app/[lang]/listings/new/NewListingWizard.tsx). به‌جای
// کپی‌کردن ~۱۵۰ خط کد پیچیده در دو جا، این فایل یک تابع عمومی و قابل‌تنظیم (compressVideoFile)
// ارائه می‌دهد؛ هر دو ویژگی (استوری، ویدئوی آگهی) فقط پارامترهای خودشان را پاس می‌دهند.
//
// **چرا همه‌چیز سمت مرورگر انجام می‌شود، نه سرور:** پروژه روی Vercel Hobby است (سقف اجرای هر
// تابع سرورلس فقط ۱۰ ثانیه) و صریحاً برای اینترنت ۲G/۳G بهینه شده. یک کتابخانه‌ی رمزگذاری
// واقعی مثل ffmpeg.wasm حدود ۲۵ مگابایت دانلود اضافه می‌کند — نقطه‌مقابل همان فلسفه. به‌جایش از
// دو API بومی مرورگر استفاده می‌شود: Canvas (تغییر رزولوشن هر فریم) + MediaRecorder (رمزگذاری
// واقعی فریم‌های کشیده‌شده). صفر بایت دانلود اضافه.
//
// **محدودیت شناخته‌شده:** خروجی MediaRecorder به فرمت mp4 یا webm بستگی به پشتیبانی مرورگر
// کاربر دارد (سافاری/آیفون معمولاً فقط mp4 ضبط می‌کند؛ کروم/اندروید معمولاً فقط webm). کد پایین
// اول mp4 را امتحان می‌کند. این یک مصالحه‌ی آگاهانه است، دقیقاً به‌خاطر هزینه‌ی دانلود ffmpeg.wasm
// که با فلسفه‌ی «سبک برای ۲G/۳G» پروژه در تضاد بود.
//
// این فایل فقط سمت مرورگر اجرا می‌شود (Canvas/MediaRecorder API) — هرگز داخل Server Action یا
// هر فایل سروری import نشود.
"use client";

export type VideoCompressionOptions = {
  // حداکثر مدت‌زمان خروجی (ثانیه). اگر ویدئوی منبع طولانی‌تر بود، فقط همین مقدار از ابتدای آن
  // استفاده می‌شود.
  maxDurationSeconds: number;
  // حداکثر طول ضلع بزرگ‌تر خروجی (پیکسل).
  maxDimensionPx: number;
  // حجم هدف خروجی (بایت) — bitrate بر اساس همین عدد و مدت‌زمان واقعی محاسبه می‌شود.
  targetMaxBytes: number;
  // سقف مطلق بعد از ضبط (چون bitrate هدف تخمینی است، نه تضمینی). پیش‌فرض: ۱٫۲ برابر targetMaxBytes.
  hardCapBytes?: number;
  // سقف حفاظتی روی حجم فایل خامِ ورودی، پیش از هر پردازشی.
  maxSourceBytes?: number;
  audioBitrateBps?: number;
  minBitrateBps?: number;
  maxBitrateBps?: number;
  captureFps?: number;
};

export type CompressedVideo = {
  blob: Blob;
  previewUrl: string;
  sizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
  durationSeconds: number;
};

const DEFAULTS = {
  hardCapMultiplier: 1.2,
  maxSourceBytes: 300 * 1024 * 1024,
  audioBitrateBps: 96_000,
  minBitrateBps: 300_000,
  maxBitrateBps: 2_500_000,
  captureFps: 24,
};

// آیا مرورگر جاری اصلاً امکان فشرده‌سازی ویدئو را دارد؟ (Canvas.captureStream + MediaRecorder).
// UI باید این را قبل از نشان‌دادن گزینه‌ی «انتخاب ویدئو» صدا بزند.
export function isVideoCompressionSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const canvas = document.createElement("canvas");
  return typeof (canvas as HTMLCanvasElement & { captureStream?: unknown }).captureStream === "function";
}

function pickSupportedVideoMimeType(): string {
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
  return "";
}

function loadVideoElement(file: File): Promise<{ video: HTMLVideoElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
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

function computeOutputDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxDimensionPx: number
): { width: number; height: number } {
  let width = sourceWidth || maxDimensionPx;
  let height = sourceHeight || maxDimensionPx;
  const longestEdge = Math.max(width, height);

  if (longestEdge > maxDimensionPx) {
    const scale = maxDimensionPx / longestEdge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  width = width - (width % 2);
  height = height - (height % 2);

  return { width: Math.max(2, width), height: Math.max(2, height) };
}

function computeVideoBitrate(
  effectiveDurationSeconds: number,
  hasAudio: boolean,
  targetMaxBytes: number,
  audioBitrateBps: number,
  minBitrateBps: number,
  maxBitrateBps: number
): number {
  const audioBits = hasAudio ? audioBitrateBps * effectiveDurationSeconds : 0;
  const totalTargetBits = targetMaxBytes * 8;
  const videoBits = Math.max(0, totalTargetBits - audioBits);
  const bitrate = Math.round(videoBits / effectiveDurationSeconds);
  return Math.min(maxBitrateBps, Math.max(minBitrateBps, bitrate));
}

type CaptureCapableCanvas = HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream };
type CaptureCapableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  requestVideoFrameCallback?: (callback: () => void) => number;
};

// فشرده‌سازی واقعی ویدئو: فایل منبع را در یک عنصر <video> پنهان پخش می‌کند، هر فریم را روی یک
// canvas با رزولوشن کاهش‌یافته می‌کشد، و همان canvas را با MediaRecorder به یک ویدئوی تازه و
// کوچک رمزگذاری می‌کند — حداکثر تا options.maxDurationSeconds ثانیه.
export async function compressVideoFile(
  file: File,
  options: VideoCompressionOptions,
  onProgress?: (ratio: number) => void
): Promise<CompressedVideo> {
  const maxSourceBytes = options.maxSourceBytes ?? DEFAULTS.maxSourceBytes;
  const hardCapBytes = options.hardCapBytes ?? Math.round(options.targetMaxBytes * DEFAULTS.hardCapMultiplier);
  const audioBitrateBps = options.audioBitrateBps ?? DEFAULTS.audioBitrateBps;
  const minBitrateBps = options.minBitrateBps ?? DEFAULTS.minBitrateBps;
  const maxBitrateBps = options.maxBitrateBps ?? DEFAULTS.maxBitrateBps;
  const captureFps = options.captureFps ?? DEFAULTS.captureFps;

  if (!isVideoCompressionSupported()) {
    throw new Error("videoRecordingUnsupported");
  }
  if (file.size > maxSourceBytes) {
    throw new Error("videoFileTooLarge");
  }

  const { video, objectUrl } = await loadVideoElement(file);

  try {
    const sourceDuration = Number.isFinite(video.duration) ? video.duration : 0;
    if (!sourceDuration || sourceDuration <= 0) {
      throw new Error("videoUnreadable");
    }

    const effectiveDuration = Math.min(sourceDuration, options.maxDurationSeconds);
    const { width, height } = computeOutputDimensions(
      video.videoWidth,
      video.videoHeight,
      options.maxDimensionPx
    );

    const canvas = document.createElement("canvas") as CaptureCapableCanvas;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvasContextUnavailable");

    const captureVideo = video as CaptureCapableVideo;
    const sourceStream = captureVideo.captureStream?.();
    const audioTracks = sourceStream?.getAudioTracks() ?? [];

    const canvasStream = canvas.captureStream(captureFps);
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

    const mimeType = pickSupportedVideoMimeType();
    const videoBitsPerSecond = computeVideoBitrate(
      effectiveDuration,
      audioTracks.length > 0,
      options.targetMaxBytes,
      audioBitrateBps,
      minBitrateBps,
      maxBitrateBps
    );
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
    if (blob.size > hardCapBytes) throw new Error("videoTooLargeAfterCompression");

    onProgress?.(1);

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      sizeBytes: blob.size,
      mimeType: blob.type,
      width,
      height,
      durationSeconds: Math.round(effectiveDuration * 10) / 10,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}