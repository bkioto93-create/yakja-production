// مسیر فایل: src/app/[lang]/auth/verify/page.tsx
import { redirect } from "next/navigation";
import { getDictionary } from "@/dictionaries/getDictionary";
import { VerifyClient } from "./VerifyClient";

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { lang } = await params;
  const { phone } = await searchParams;
  const dict = await getDictionary(lang);

  if (!phone) {
    redirect(`/${lang}/auth/login`);
  }

  return (
    <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-text-main mb-2">
            {dict.auth.verify.title}
          </h1>
          <p className="text-sm text-text-muted">{dict.auth.verify.subtitle}</p>
        </div>
        <VerifyClient lang={lang} dict={dict} phoneNumber={phone} />
      </div>
    </div>
  );
}