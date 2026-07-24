// مسیر فایل: src/lib/marketplace/imageCompression.ts
// تسک ۵ فاز ۰۲ — فشرده‌سازی تصویر سمت کلاینت پیش از فرستادن به Storage.
// هدف: هر تصویر نهایی حدود ۱۵۰ تا ۲۵۰ کیلوبایت باشد (بند ۵.۳ و بند ۱۱ سند راهبردی — بهینه‌سازی
// برای اینترنت ۲G/۳G و گوشی‌های ارزان‌قیمت رایج در افغانستان). عدد ۱۵۰ کیلوبایت به‌عنوان کف
// سخت‌گیرانه اعمال نشده (تصویر ساده‌تر طبیعتاً کوچک‌تر هم می‌شود که خودش مطلوب‌تر است)؛ فقط سقف
// ۲۵۰ کیلوبایت به‌طور فعال با کاهش پلکانی کیفیت کنترل می‌شود.
// **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** پیام‌های new Error() درون این فایل پیش‌تر جمله‌ی کامل
// دری بودند؛ گرچه در عمل هرگز به کاربر نمایش داده نمی‌شدند (فراخوان‌ها فقط catch{} خالی دارند
// و پیام دیکشنری‌محور خودشان را با errorText(...) نشان می‌دهند)، طبق یادداشت فنی نسخه‌ی ۲.۳ سند
// راهبردی (بند ۴)، تمام خطاهای تولیدشده در لایه‌ی منطق/سرور باید یک کد کوتاه انگلیسی باشند،
// نه جمله‌ی نهایی دری/پشتو. اکنون همین الگو رعایت شده است.
// این فایل فقط سمت مرورگر اجرا می‌شود (از Canvas API استفاده می‌کند) — هرگز داخل Server Action
// یا هر فایل سروری import نشود.
"use client";

const MAX_DIMENSION_PX = 1280;
const TARGET_MAX_BYTES = 250 * 1024;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.1;
const INITIAL_QUALITY = 0.8;

export type CompressedImage = {
  blob: Blob;
  previewUrl: string;
  sizeBytes: number;
};

function loadImage(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
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

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const { img, objectUrl } = await loadImage(file);

  let { width, height } = img;
  if (width > height && width > MAX_DIMENSION_PX) {
    height = Math.round((height * MAX_DIMENSION_PX) / width);
    width = MAX_DIMENSION_PX;
  } else if (height >= width && height > MAX_DIMENSION_PX) {
    width = Math.round((width * MAX_DIMENSION_PX) / height);
    height = MAX_DIMENSION_PX;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  URL.revokeObjectURL(objectUrl);
  if (!ctx) throw new Error("canvasContextUnavailable");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = INITIAL_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  // کاهش پلکانی کیفیت تا رسیدن زیر سقف هدف (۲۵۰ کیلوبایت) یا رسیدن به حداقل کیفیت مجاز
  while (blob.size > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await canvasToBlob(canvas, quality);
  }

  return { blob, previewUrl: URL.createObjectURL(blob), sizeBytes: blob.size };
}

