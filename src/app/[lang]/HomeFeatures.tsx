// مسیر فایل: src/app/[lang]/HomeFeatures.tsx
// تسک بازطراحی صفحه‌ی اصلی — بخش «ویژگی‌های یکجا» که کارفرما درخواست کرده بود:
// «یه بخشی هم مثلا ویژگی‌های یکجا در موردش توضیح بدیم که چرا باید ازش استفاده کنن».
// Server Component خالص، بدون هیچ تعامل یا فراخوانی دیتابیسی — فقط نمایش شش کارتِ ایستا.
import { Icons } from "@/components/ui/Icons";
import { Card } from "@/components/ui/Card";

type FeaturesDict = {
  title: string;
  subtitle: string;
  item1Title: string;
  item1Desc: string;
  item2Title: string;
  item2Desc: string;
  item3Title: string;
  item3Desc: string;
  item4Title: string;
  item4Desc: string;
  item5Title: string;
  item5Desc: string;
  item6Title: string;
  item6Desc: string;
};

export function HomeFeatures({ dict }: { dict: FeaturesDict }) {
  const items = [
    { title: dict.item1Title, desc: dict.item1Desc, icon: Icons.LayoutDashboard },
    { title: dict.item2Title, desc: dict.item2Desc, icon: Icons.Phone },
    { title: dict.item3Title, desc: dict.item3Desc, icon: Icons.Lock },
    { title: dict.item4Title, desc: dict.item4Desc, icon: Icons.MessageSquare },
    { title: dict.item5Title, desc: dict.item5Desc, icon: Icons.CheckCircle },
    { title: dict.item6Title, desc: dict.item6Desc, icon: Icons.Flag },
  ];

  return (
    <section>
      <div className="text-center mb-5 px-4 md:px-0">
        <h2 className="font-extrabold text-xl md:text-2xl text-text-main">{dict.title}</h2>
        <p className="text-sm text-text-muted mt-1 max-w-lg mx-auto">{dict.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 md:px-0">
        {items.map((item) => (
          <Card key={item.title} className="p-4 flex flex-col gap-2">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-text-main">{item.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
