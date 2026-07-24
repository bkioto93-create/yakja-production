// مسیر فایل: src/lib/pwaInstall/actions.ts
// ثبت کوکی «رد کردن پیشنهاد نصب» — دقیقاً هم‌الگو با src/lib/disclaimer/actions.ts. وقتی کاربر
// روی «شاید بعداً» می‌زند، یا وقتی پنجره‌ی نصب اندروید را رد می‌کند، همین یک اکشن صدا زده می‌شود.
"use server";

import { cookies } from "next/headers";
import { PWA_INSTALL_COOKIE_NAME, PWA_INSTALL_COOKIE_MAX_AGE } from "./constants";

export async function dismissPwaInstallAction() {
  const cookieStore = await cookies();
  cookieStore.set(PWA_INSTALL_COOKIE_NAME, "1", {
    path: "/",
    maxAge: PWA_INSTALL_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}