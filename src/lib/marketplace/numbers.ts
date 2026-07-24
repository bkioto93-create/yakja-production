// مسیر فایل: src/lib/marketplace/numbers.ts
// تبدیل ارقام فارسی/عربی (که کیبورد دری/پشتو معمولاً روی گوشی تولید می‌کند) به ارقام انگلیسی،
// پیش از اعتبارسنجی عددی (قیمت آگهی). بدون این تبدیل، کاربری که ارقام فارسی تایپ می‌کند در فیلد
// قیمت با خطای «عدد نامعتبر» مواجه می‌شد، چون Number() فقط ارقام ASCII را می‌شناسد.
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toAsciiDigits(input: string): string {
  return input
    .split("")
    .map((char) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(char);
      if (persianIndex !== -1) return String(persianIndex);
      const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char);
      if (arabicIndex !== -1) return String(arabicIndex);
      return char;
    })
    .join("");
}

export function sanitizePriceInput(raw: string): string {
  const ascii = toAsciiDigits(raw);
  return ascii.replace(/[^\d.]/g, "");
}