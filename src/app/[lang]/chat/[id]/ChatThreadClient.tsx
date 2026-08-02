// مسیر فایل: src/app/[lang]/chat/[id]/ChatThreadClient.tsx
// فاز ۱۲ — بخش تعاملی صفحه‌ی یک گفتگو: فهرست پیام‌ها (زنده، از طریق Supabase Realtime)، فرستادن
// پیام متنی، ضبط و فرستادن پیام صوتی.
//
// طراحی عمدی حباب‌های پیام: صرف‌نظر از جهت متن (fa/ps راست‌به‌چپ‌اند)، پیام‌های «خودِ کاربر» همیشه
// با margin فیزیکی (نه منطقی/RTL-aware) به سمت راست چیده می‌شوند — دقیقاً همان قرارداد دیداری
// واتساپ/تلگرام حتی در حالت فارسی/عربی: جهت خواندن متن عوض می‌شود، اما جای حباب «پیام من» ثابت
// می‌ماند تا چشم کاربر بین چت‌های مختلف اپ‌ها گیج نشود.
//
// ضبط صدا: با MediaRecorder مرورگر (audio/webm) — پشتیبانی گسترده روی کروم/اندروید (پلتفرم اصلی
// مخاطبان طبق سند راهبردی)؛ در مرورگرهایی که audio/webm را پشتیبانی نمی‌کنند (عمدتاً iOS Safari
// قدیمی)، دکمه‌ی ضبط با پیام خطای مناسب غیرفعال می‌شود، نه کرش خاموش.
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VipBadge } from "@/components/vip/VipBadge";
import { ChatRetentionNotice } from "@/components/chat/ChatRetentionNotice";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { MicrophoneIcon } from "@heroicons/react/24/solid";
import {
  sendTextMessageAction,
  createVoiceUploadSlotAction,
  sendVoiceMessageAction,
} from "../actions";
import type { getDictionary } from "@/dictionaries/getDictionary";
import type { Locale } from "@/lib/i18n/constants";
import type { ConversationView, ChatMessageView } from "@/lib/chat/chatQueries";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const VOICE_MIME_TYPE = "audio/webm";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ChatThreadClient({
  lang,
  dict,
  viewerId,
  conversation,
  initialMessages,
}: {
  lang: Locale;
  dict: Dict;
  viewerId: string;
  conversation: ConversationView;
  initialMessages: ChatMessageView[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const chatDict = dict.chat;
  const errorsDict = chatDict.errors as Record<string, string>;
  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [text, setText] = useState("");
  const [isSending, startSending] = useTransition();
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "uploading">("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // اشتراک زنده‌ی Realtime — دقیقاً هم‌الگو با src/app/[lang]/transport/ActiveDriversList.tsx،
  // با این تفاوت که اینجا فقط پیام‌های همین یک گفتگو (filter) گوش داده می‌شود، نه کل جدول.
  useEffect(() => {
    const channel = supabaseBrowserClient
      .channel(`conversation-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            message_type: "text" | "voice";
            content: string | null;
            voice_path: string | null;
            voice_duration_seconds: number | null;
            created_at: string;
          };

          // پیام‌های خودِ همین کاربر که خودِ همین تب فرستاده، از قبل به‌صورت خوش‌بینانه
          // (Optimistic) در state هست — دوباره اضافه‌اش نمی‌کنیم.
          if (seenMessageIdsRef.current.has(row.id)) return;
          seenMessageIdsRef.current.add(row.id);

          // پیام صوتی که از Realtime می‌رسد فاقد Signed URL آماده است (چون آن URL فقط سمت سرور
          // ساخته می‌شود)؛ برای پیام صوتیِ طرفِ مقابل، صفحه را با router.refresh() تازه می‌کنیم تا
          // getConversationMessages دوباره روی سرور اجرا شود و Signed URL درست بسازد. برای پیام
          // متنی نیازی به این کار نیست.
          if (row.message_type === "voice" && row.sender_id !== viewerId) {
            router.refresh();
            return;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: row.id,
              conversationId: conversation.id,
              senderId: row.sender_id,
              messageType: row.message_type,
              content: row.content,
              voiceUrl: null,
              voiceDurationSeconds: row.voice_duration_seconds,
              createdAt: row.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowserClient.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  function handleSendText() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");
    startSending(async () => {
      const result = await sendTextMessageAction(lang, conversation.id, trimmed);
      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }
      // به‌روزرسانی خوش‌بینانه — به‌جای منتظرماندن برای رویداد Realtime خودمان.
      const optimisticId = `optimistic-${Date.now()}`;
      seenMessageIdsRef.current.add(optimisticId);
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          conversationId: conversation.id,
          senderId: viewerId,
          messageType: "text",
          content: trimmed,
          voiceUrl: null,
          voiceDurationSeconds: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    });
  }

  async function handleStartRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      showToast(errorText("voiceNotSupported"), "error");
      return;
    }
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported(VOICE_MIME_TYPE)) {
      showToast(errorText("voiceNotSupported"), "error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: VOICE_MIME_TYPE });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      showToast(errorText("microphonePermissionDenied"), "error");
    }
  }

  function handleCancelRecording() {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecordingState("idle");
    setRecordingSeconds(0);
  }

  function handleStopAndSendRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const finalDuration = recordingSeconds;
    setRecordingState("uploading");

    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach((track) => track.stop());
      const audioBlob = new Blob(audioChunksRef.current, { type: VOICE_MIME_TYPE });
      audioChunksRef.current = [];

      const slotResult = await createVoiceUploadSlotAction(conversation.id);
      if (!slotResult.success) {
        showToast(errorText(slotResult.error), "error");
        setRecordingState("idle");
        return;
      }

      const { error: uploadError } = await supabaseBrowserClient.storage
        .from("chat-voice-messages")
        .uploadToSignedUrl(slotResult.slot.path, slotResult.slot.token, audioBlob, {
          contentType: VOICE_MIME_TYPE,
        });

      if (uploadError) {
        showToast(errorText("uploadFailed"), "error");
        setRecordingState("idle");
        return;
      }

      const sendResult = await sendVoiceMessageAction(
        lang,
        conversation.id,
        slotResult.slot.path,
        finalDuration
      );

      setRecordingState("idle");
      setRecordingSeconds(0);

      if (!sendResult.success) {
        showToast(errorText(sendResult.error), "error");
        return;
      }

      // پیام صوتیِ خودِ کاربر را با یک Signed URL موقتی محلی (Object URL) بلافاصله نشان می‌دهیم؛
      // بعد از رفرش بعدی صفحه، همان پیام با Signed URL واقعی سرور جایگزین می‌شود.
      const optimisticId = `optimistic-${Date.now()}`;
      seenMessageIdsRef.current.add(optimisticId);
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          conversationId: conversation.id,
          senderId: viewerId,
          messageType: "voice",
          content: null,
          voiceUrl: URL.createObjectURL(audioBlob),
          voiceDurationSeconds: finalDuration,
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    recorder.stop();
    mediaRecorderRef.current = null;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-65px)] md:h-[calc(100dvh-72px)]">
      {/* هدر گفتگو */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <Link
          href={`/${lang}/chat`}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-text-muted active:bg-bg-base"
        >
          <Icons.ArrowRight className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
          {conversation.contextImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.contextImageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <Icons.MessageSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-text-main truncate">
              {conversation.otherUserName || chatDict.unknownUser}
            </span>
            {conversation.otherUserIsVip && <VipBadge label={dict.vip.badgeLabel} />}
          </div>
          <span className="text-xs text-text-muted truncate">{conversation.contextLabel}</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        <ChatRetentionNotice message={chatDict.retentionNotice} />
      </div>

      {/* فهرست پیام‌ها */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <p className="text-xs text-text-muted text-center mt-6">{chatDict.emptyThreadNotice}</p>
        )}
        {messages.map((message) => {
          const isOwn = message.senderId === viewerId;
          return (
            <div
              key={message.id}
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                isOwn ? "ml-auto bg-primary text-white" : "mr-auto bg-white border border-slate-100 text-text-main"
              }`}
            >
              {message.messageType === "text" ? (
                <p className="text-sm whitespace-pre-line break-words">{message.content}</p>
              ) : message.voiceUrl ? (
                <audio src={message.voiceUrl} controls className="max-w-[220px] h-10" />
              ) : (
                <span className="text-xs opacity-70">{chatDict.voiceUnavailable}</span>
              )}
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      {/* ورودی پیام */}
      <div className="border-t border-slate-100 bg-white px-3 py-2.5 pb-safe">
        {recordingState === "idle" ? (
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder={chatDict.messagePlaceholder}
              className="flex-1 min-w-0 bg-bg-base border border-slate-200 text-text-main rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted text-sm"
            />
            {text.trim() ? (
              <button
                type="button"
                onClick={handleSendText}
                disabled={isSending}
                aria-label={chatDict.sendButtonLabel}
                className="w-12 h-12 shrink-0 rounded-2xl bg-primary text-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60"
              >
                {isSending ? <Spinner className="w-5 h-5" /> : <Icons.ArrowRight className="w-5 h-5 rotate-180" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRecording}
                aria-label={chatDict.recordVoiceLabel}
                className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-transform"
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : recordingState === "recording" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelRecording}
              aria-label={chatDict.cancelRecordingLabel}
              className="w-12 h-12 shrink-0 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Icons.X className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-red-50 rounded-2xl px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-sm font-bold text-red-600" dir="ltr">
                {formatDuration(recordingSeconds)}
              </span>
              <span className="text-xs text-red-500">{chatDict.recordingInProgress}</span>
            </div>
            <button
              type="button"
              onClick={handleStopAndSendRecording}
              aria-label={chatDict.sendButtonLabel}
              className="w-12 h-12 shrink-0 rounded-2xl bg-primary text-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <Icons.ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3">
            <Spinner className="w-5 h-5" />
            <span className="text-sm text-text-muted">{chatDict.uploadingVoice}</span>
          </div>
        )}
      </div>
    </div>
  );
}