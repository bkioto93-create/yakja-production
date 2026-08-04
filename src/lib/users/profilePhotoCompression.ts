// مسیر فایل: src/lib/users/profilePhotoCompression.ts
// عکس پروفایل کاربر — فشرده‌سازی سمت کلاینت، پیش از آپلود. طبق درخواست صریح کارفرما: «به شدت
// کمپرس بشه و کیفیتش حفظ بشه اما به شدت کم‌حجم باشه».
//
// چرا این فایل با src/lib/marketplace/imageCompression.ts (و نسخه‌ی مشابهش در
// src/lib/stories/storyMediaProcessor.ts) یکی نشد: آن دو یک عکسِ مستطیلی را «به همان نسبتِ
// اصلی» resize می‌کنند (چون در گالری آگهی/استوریِ تمام‌صفحه با هر نسبتی نمایش داده می‌شود). عکس
// پروفایل برعکس، همیشه در یک قاب *مربعی/دایره‌ای* (آواتار) دیده می‌شود — پس اینجا علاوه بر
// resize، یک قدم اضافه هم داریم: برش مرکزی به مربع (center-crop)، دقیقاً همان کاری که
// اینستاگرام/توییتر برای آواتار انجام می‌دهند. نتیجه: چون عکس ذخیره‌شده از همان ابتدا مربعی و
// کوچک است (نه یک عکس بزرگ مستطیلی که با CSS برش داده شود)، هم حجم نهایی به‌مراتب کمتر است، هم
// همیشه دقیقاً هم‌مرکز با محتوای اصلی عکس نمایش داده می‌شود.
"use client";

// آواتار همیشه خیلی کوچک دیده می‌شود (حداکثر چند ده پیکسل در اکثر جاهای اپ)، پس ۵۱۲px یک سقف
// کاملاً سخاوتمندانه است (حتی برای صفحه‌های رتینا/چگالی‌بالا) و به‌مراتب کوچک‌تر از سقف‌های عکس
// آگهی/استوری (۱۰۸۰-۱۲۸۰px).
const MAX_DIMENSION_PX = 512;
// سقفِ هدف: چون تصویر از قبل کوچک و مربعی است، ۹۰ کیلوبایت برای این ابعاد کیفیت بسیار خوبی
// می‌دهد — خیلی کمتر از سقف ۲۵۰-۳۰۰ کیلوبایتِ عکس آگهی/استوری.
const TARGET_MAX_BYTES = 90 * 1024;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.06;
const INITIAL_QUALITY = 0.86;

export type CompressedProfilePhoto = {
  blob: Blob;
  previewUrl: string;
  sizeBytes: number;
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

export async function compressProfilePhoto(file: File): Promise<CompressedProfilePhoto> {
  const { img, objectUrl } = await loadImageElement(file);

  // برش مرکزی به مربع: ضلعِ کوچک‌تر عکس اصلی، اندازه‌ی مربع نهایی را تعیین می‌کند — دقیقاً همان
  // چیزی که هر اپ آواتاردار (اینستاگرام/توییتر/...) انجام می‌دهد.
  const squareSide = Math.min(img.width, img.height);
  const sourceX = Math.round((img.width - squareSide) / 2);
  const sourceY = Math.round((img.height - squareSide) / 2);

  const outputSide = Math.min(MAX_DIMENSION_PX, squareSide);

  const canvas = document.createElement("canvas");
  canvas.width = outputSide;
  canvas.height = outputSide;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvasContextUnavailable");

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    squareSide,
    squareSide, // ناحیه‌ی مربعیِ منبع (برش)
    0,
    0,
    outputSide,
    outputSide // مقصد روی canvas (تغییر اندازه به سقف مجاز)
  );
  URL.revokeObjectURL(objectUrl);

  let quality = INITIAL_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await canvasToBlob(canvas, quality);
  }

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    sizeBytes: blob.size,
  };
}