// مسیر فایل: src/app/[lang]/HomeAbout.tsx
// 🆕 بخش تازه — «یکجا چیست؟» — طبق درخواست صریح کارفرما: چون هر روز یک قابلیت تازه به یکجا
// اضافه می‌شود (استوری، VIP، دسته‌بندی‌ها، و بعداً نرخ اسعار)، باید یک بخش ثابت در پایین‌ترین
// قسمت صفحه‌ی اصلی باشد که دقیقاً و کامل توضیح بدهد یکجا چه اپلیکیشنی است و چه خدماتی ارائه
// می‌دهد — هم برای کاربر انسانی، هم (مهم‌تر) برای بات‌های گوگل، چون این تنها بخشِ صفحه‌ی اصلی
// است که محتوای متنیِ واقعی و قابل‌خزیدن درباره‌ی «یکجا چیست» دارد؛ بقیه‌ی صفحه بیشتر آیکون/کارت
// است، نه پاراگراف. Server Component خالص، بدون تعامل — دقیقاً هم‌الگو با HomeFeatures.tsx.
//
// جای‌گذاری: قبل از Footer، بعد از HomeFaq (پایین‌ترین بخش محتوای صفحه‌ی اصلی، قبل از فوتر و
// ناوبار) — دقیقاً طبق دستور کارفرما.
//
// تصویر: از یک تصویر سفارشی (public/images/about-yakja.webp) استفاده می‌شود — دقیقاً هم‌الگو با
// بقیه‌ی تصاویر سفارشی این پروژه (بنرهای CategoryBanner، هیرو). پرامپت تولید تصویر و مسیر دقیق
// ذخیره، در پیام تحویل همین تسک آمده، نه در این فایل.
import Image from "next/image";
import { Icons } from "@/components/ui/Icons";

type HomeAboutDict = {
  title: string;
  subtitle: string;
  intro: string;
  items: { title: string; desc: string }[];
  closing: string;
  imageAlt: string;
};

const ITEM_ICONS = [Icons.Box, Icons.Truck, Icons.Wrench, Icons.Home, Icons.MessageSquare, Icons.CheckCircle];

export function HomeAbout({ dict }: { dict: HomeAboutDict }) {
  return (
    <section aria-labelledby="home-about-title">
      <div className="text-center mb-5 px-4 md:px-0">
        <h2 id="home-about-title" className="font-extrabold text-xl md:text-2xl text-text-main">
          {dict.title}
        </h2>
        <p className="text-sm text-text-muted mt-1 max-w-lg mx-auto">{dict.subtitle}</p>
      </div>

      <div className="rounded-[28px] border border-slate-100 bg-white overflow-hidden md:flex md:items-center md:gap-8 px-4 md:px-8 py-6 md:py-8">
        {/* تصویر — فقط از md به‌بالا کنار متن؛ روی موبایل بالای متن. */}
        <div className="relative w-full md:w-[280px] lg:w-[320px] shrink-0 aspect-[4/3] rounded-[22px] overflow-hidden mb-5 md:mb-0">
          <Image
            src="/images/about-yakja.webp"
            alt={dict.imageAlt}
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* پاراگرافِ اصلیِ SEO — متنِ واقعی، نه فقط لیست؛ همان چیزی که بات گوگل واقعا می‌خواند. */}
          <p className="text-sm text-text-muted leading-relaxed mb-5">{dict.intro}</p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dict.items.map((item, i) => {
              const ItemIcon = ITEM_ICONS[i] ?? Icons.CheckCircle;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ItemIcon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-bold text-sm text-text-main">{item.title}</span>
                    <span className="text-xs text-text-muted leading-relaxed mt-0.5">{item.desc}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="text-sm font-semibold text-text-main mt-5">{dict.closing}</p>
        </div>
      </div>
    </section>
  );
}