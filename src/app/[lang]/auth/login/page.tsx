// مسیر فایل: src/app/[lang]/auth/login/page.tsx
import { getDictionary } from "@/dictionaries/getDictionary";
import { LoginClient } from "./LoginClient";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-col min-h-[70vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-text-main mb-2">
            {dict.auth.login.title}
          </h1>
          <p className="text-sm text-text-muted">{dict.auth.login.subtitle}</p>
        </div>
        <LoginClient lang={lang} dict={dict} />
      </div>
    </div>
  );
}