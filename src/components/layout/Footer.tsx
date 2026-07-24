// مسیر فایل: src/components/layout/Footer.tsx
import Link from "next/link";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export function Footer({ lang, dict }: { lang: string; dict: Dictionary }) {
  return (
    <footer className="mt-8 text-center pb-8 border-t border-slate-200 mx-4 pt-6 text-sm flex flex-col items-center justify-center gap-3 w-[calc(100%-2rem)] shrink-0 self-center">
      <Link 
        href={`/${lang}/contact`} 
        className="font-bold text-primary active:scale-95 px-5 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        {dict.footer.contact}
      </Link>
      <span className="opacity-70 leading-relaxed font-semibold text-xs mt-2 block w-full text-balance">
        {dict.footer.copyright}
      </span>
    </footer>
  );
}