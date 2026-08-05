// مسیر فایل: src/app/api/mobile/v1/chat/[id]/read/route.ts
// قابلیت چت (هم‌سازی موبایل) — نسخه‌ی HTTP-محورِ «علامت‌گذاری این گفتگو به‌عنوان خوانده‌شده».
// صفر منطق تجاری تازه — همان markConversationAsReadAction موجود صدا زده می‌شود.
import "server-only";
import { NextResponse } from "next/server";
import { markConversationAsReadAction } from "@/app/[lang]/chat/actions";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await markConversationAsReadAction(id);
  return NextResponse.json(result);
}