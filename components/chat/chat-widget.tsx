"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { Dictionary } from "@/messages/types";

type Msg = { role: "user" | "assistant"; content: string };

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; // e.g. 41791234567

export function ChatWidget({ dict }: { dict: Dictionary["chat"] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(false);
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages([...history, { role: "assistant", content: current }]);
      }
    } catch {
      setMessages(history);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(dict.whatsappPrefill)}`
    : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-academy-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-academy-line bg-academy-paper-soft px-4 py-3">
            <span className="text-sm font-semibold text-academy-navy">{dict.title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.close}
              className="text-academy-slate-muted hover:text-academy-navy"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <p className="rounded-xl bg-academy-paper-soft px-3 py-2 text-sm text-academy-slate">
              {dict.intro}
            </p>
            {messages.map((m, i) => (
              <p
                key={i}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-xl bg-[color:var(--brand-deep)] px-3 py-2 text-sm text-white"
                    : "mr-4 whitespace-pre-wrap rounded-xl bg-academy-paper-soft px-3 py-2 text-sm text-academy-slate"
                }
              >
                {m.content || "…"}
              </p>
            ))}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{dict.error}</p>
            )}
          </div>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border-t border-academy-line px-4 py-2 text-center text-xs font-medium text-[color:var(--brand-deep)] hover:underline"
            >
              {dict.whatsapp}
            </a>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-academy-line px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dict.placeholder}
              maxLength={2000}
              className="min-w-0 flex-1 rounded-lg border border-academy-line px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-deep)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={dict.send}
              className="rounded-lg bg-[color:var(--brand-deep)] p-2 text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? dict.close : dict.open}
        className="flex h-13 w-13 items-center justify-center rounded-full bg-[color:var(--brand-deep)] p-3.5 text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
