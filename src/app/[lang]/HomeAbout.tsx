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
//
// **بازطراحی (درخواست صریح کارفرما — «مثل بنر هدر تیره بشه»):** کارتِ سفیدِ قبلی به همان الگوی
// Premium/Dark Mode بنرِ اصلیِ صفحه (بالای همین فایل، در page.tsx) تبدیل شد: پس‌زمینه‌ی
// bg-hero-dark (#0B1121) + همان سه‌هاله‌ی نوریِ محوِ Mesh Gradient (فیروزه‌ای + آبی، blur عمیق)،
// متن‌ها به توکن‌های on-dark (سفید/سفیدِ کم‌رنگ) تغییر کردند. رنگِ خودِ آیکون‌ها (text-primary)
// دست‌نخورده ماند — طبق تاکیدِ صریحِ کارفرما «همون رنگ بمونه» — فقط بجایِ بک‌گراندِ صافِ
// bg-primary/10 (که روی زمینه‌ی تیره تیره/کدر می‌شد، دقیقاً همان مشکلی که در کاشیِ حمل‌ونقلِ
// دسترسی عاجل رفع شد)، حالا هر آیکون یک هاله‌ی نوریِ بلورشده‌ی جدا پشتش دارد (blur-md، رنگِ
// primary) به‌علاوه‌ی یک بَجِ شیشه‌ایِ نیمه‌شفاف (bg-white/10) — دقیقاً همان جلوه‌ی «درخشیدنِ
// روی بک‌گراندِ تیره» که خواسته شده بود، نه یک رنگِ شفافِ ساده که روی تیره کدر دیده شود.
//
// **افزوده‌شده (درخشش پشتِ خودِ تصویر هم):** طبق بازخوردِ کارفرما، یک هاله‌ی نوریِ محوِ جدا
// (blur-2xl، رنگِ primary) پشتِ خودِ تصویرِ اصلی هم اضافه شد — نه فقط پشتِ آیکون‌های کوچک.
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

      <div className="relative isolate overflow-hidden rounded-[28px] bg-hero-dark md:flex md:items-center md:gap-8 px-4 md:px-8 py-6 md:py-8">
        {/* نورپردازی مدرن پس‌زمینه (Mesh Gradient) — عیناً همان سه‌هاله‌ی بنرِ اصلیِ صفحه بالا،
            فقط با اندازه‌ی کمی کوچک‌تر متناسب با این کارت. */}
        <div className="absolute -top-20 -left-14 w-[220px] h-[220px] bg-primary/35 rounded-full blur-[90px] z-0 pointer-events-none" />
        <div className="absolute -bottom-16 -right-10 w-[200px] h-[200px] bg-blue-600/20 rounded-full blur-[90px] z-0 pointer-events-none" />
        <div className="absolute top-1/3 right-[15%] w-[150px] h-[150px] bg-primary/20 rounded-full blur-[80px] z-0 pointer-events-none" />

        {/* تصویر — فقط از md به‌بالا کنار متن؛ روی موبایل بالای متن. طبق درخواست کارفرما، حالا
            پشتِ خودِ تصویر هم یک هاله‌ی نوریِ محو دارد (blur واقعیِ CSS، همان بلورِ عادیِ صفحه) —
            نه فقط پشتِ آیکون‌های کوچک. wrapper بیرونی عمداً overflow-hidden ندارد تا این هاله
            بتواند کمی از لبه‌ی تصویر بیرون بزند؛ خودِ کادرِ گردِ تصویر یک لایه‌ی داخلیِ جداست که
            overflow-hidden دارد، پس تصویر خودش هم‌چنان دقیقاً به همان شکلِ قبل (گردی/برش) دیده
            می‌شود. */}
        <div className="relative z-10 w-full md:w-[280px] lg:w-[320px] shrink-0 mb-5 md:mb-0">
          <div
            className="absolute -inset-4 rounded-[30px] bg-primary/35 blur-2xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative aspect-[4/3] rounded-[22px] overflow-hidden ring-1 ring-on-dark-border">
            <Image
              src="/images/about-yakja.webp"
              alt={dict.imageAlt}
              fill
              sizes="(min-width: 768px) 320px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 flex-1 min-w-0">
          {/* پاراگرافِ اصلیِ SEO — متنِ واقعی، نه فقط لیست؛ همان چیزی که بات گوگل واقعا می‌خواند. */}
          <p className="text-sm text-on-dark-muted leading-relaxed mb-5">{dict.intro}</p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dict.items.map((item, i) => {
              const ItemIcon = ITEM_ICONS[i] ?? Icons.CheckCircle;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                    {/* هاله‌ی نوریِ محو پشتِ آیکون — همان رنگِ آیکون (primary)، فقط بلورشده و
                        کمی بزرگ‌تر از خودِ بَج، تا حسِ «درخشیدن روی زمینه‌ی تیره» بدهد. */}
                    <span className="absolute -inset-2 rounded-full bg-primary/50 blur-lg" aria-hidden="true" />
                    <span className="relative w-9 h-9 rounded-xl bg-white/10 border border-on-dark-border text-primary flex items-center justify-center">
                      <ItemIcon className="w-[18px] h-[18px]" />
                    </span>
                  </span>
                  <span className="flex flex-col">
                    <span className="font-bold text-sm text-on-dark">{item.title}</span>
                    <span className="text-xs text-on-dark-muted leading-relaxed mt-0.5">{item.desc}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="text-sm font-semibold text-on-dark mt-5">{dict.closing}</p>
        </div>
      </div>
    </section>
  );
}