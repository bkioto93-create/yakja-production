// مسیر فایل: src/app/loading.tsx
// فال‌بک لودینگ برای بالاترین سطح اپ (بیرون از segment زبان‌ها). Next.js این فایل را خودکار،
// بدون نیاز به import در جایی، دور بخش‌هایی که کند بارگذاری می‌شوند می‌گذارد. در عمل بیشترِ صفحات
// زیر src/app/[lang]/loading.tsx را می‌بینند؛ این یکی فقط یک شبکه‌ی ایمنی برای موارد نادر
// بیرون از آن مسیر است.
import { PageLoader } from "@/components/ui/PageLoader";

export default function RootLoading() {
  return <PageLoader />;
}
