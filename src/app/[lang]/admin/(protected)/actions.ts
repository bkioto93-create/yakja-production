// مسیر فایل: src/app/[lang]/admin/actions.ts
"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth/session";

export async function logoutAction(lang: string) {
  await destroySession();
  redirect(`/${lang}/admin/login`);
}