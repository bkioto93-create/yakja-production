// مسیر فایل: src/lib/disclaimer/actions.ts
// تسک ۸ فاز ۰۲ — ثبت کوکی «دیده‌شدن پیام سلب مسئولیت» پس از فشردن دکمه‌ی «متوجه شدم».
"use server";

import { cookies } from "next/headers";
import { DISCLAIMER_COOKIE_NAME, DISCLAIMER_COOKIE_MAX_AGE } from "./constants";

export async function acknowledgeDisclaimerAction() {
  const cookieStore = await cookies();
  cookieStore.set(DISCLAIMER_COOKIE_NAME, "1", {
    path: "/",
    maxAge: DISCLAIMER_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}