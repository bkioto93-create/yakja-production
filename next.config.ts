import type { NextConfig } from "next";

// **رفع باگ «PWA نصب‌شده نسخه‌ی قدیمی/کش‌شده نشان می‌دهد»:** بخشی از این باگ به این برمی‌گشت که
// فایل public/sw.js (چون در پوشه‌ی public است) ممکن بود توسط مرورگر/شبکه‌ی توزیع Vercel با هدر
// کشِ نسبتاً طولانی سرو شود؛ در آن صورت مرورگر تا مدتی همان نسخه‌ی قدیمیِ sw.js را «هنوز معتبر»
// فرض می‌کرد و اصلاً متوجه نمی‌شد نسخه‌ی تازه‌تری منتشر شده — یعنی منطق آپدیت خودکار داخل sw.js
// و ServiceWorkerRegister.tsx هیچ‌وقت فرصت اجرا پیدا نمی‌کرد. هدر Cache-Control زیر صریحاً به هر
// مرورگر/CDN می‌گوید: «هر بار این فایل را دوباره از سرور بگیر، هرگز آن را کش نکن».
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;