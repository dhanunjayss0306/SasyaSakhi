"use client";

import { useEffect, useRef, useState } from "react";
import { SUGGESTED_QUESTIONS, mockChatReply } from "@/lib/mock-data";
import { BACKEND_CONFIGURED, chatWithAssistant } from "@/lib/api-client";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Eraser, Send, Sprout, User } from "lucide-react";

interface ChatWindowProps {
  initialLang: "en" | "te";
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

let nextId = 1;

function greeting(lang: "en" | "te"): string {
  return lang === "te"
    ? "నమస్కారం! నేను మీ మట్టి సహాయకుడిని. మీ నేల నివేదిక గురించి ఏదైనా అడగండి."
    : "Namaste! I'm your soil assistant. Ask me anything about your soil report.";
}

export function ChatWindow({ initialLang }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId++, role: "assistant", text: greeting(initialLang) },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  // Tracks what the last reply actually came from, for the honest header label.
  const [lastSource, setLastSource] = useState<"live" | "mock" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((prev) => [...prev, { id: nextId++, role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    void (async () => {
      // Backend first when configured; any failure falls back to mock replies.
      if (BACKEND_CONFIGURED) {
        try {
          const report = store.getReport();
          const confirmed: Record<string, number> = {};
          if (report) {
            const MAP = { ph: "pH", ec: "EC", oc: "OC", n: "N", p: "P", k: "K" } as const;
            for (const p of report.parameters) {
              if (p.value !== null) confirmed[MAP[p.key]] = p.value;
            }
          }
          const res = await chatWithAssistant(trimmed, {
            language: initialLang,
            report_id: report?.id,
            context:
              Object.keys(confirmed).length > 0
                ? { confirmed_values: confirmed }
                : undefined,
          });
          setMessages((prev) => [...prev, { id: nextId++, role: "assistant", text: res.answer }]);
          setLastSource("live");
          setTyping(false);
          return;
        } catch {
          console.debug("SasyaSakhi: backend chat unavailable, using mock reply.");
        }
      }
      timerRef.current = setTimeout(() => {
        const reply = mockChatReply(trimmed);
        setMessages((prev) => [...prev, { id: nextId++, role: "assistant", text: reply }]);
        setLastSource("mock");
        setTyping(false);
      }, 800);
    })();
  };

  const clearChat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTyping(false);
    setLastSource(null);
    setMessages([{ id: nextId++, role: "assistant", text: greeting(initialLang) }]);
  };

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sage bg-ivory px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-ivory">
            <Sprout className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-charcoal">SasyaSakhi Assistant</p>
            <p className="text-xs text-charcoal/60">
              {lastSource === "live"
                ? "Live answers"
                : lastSource === "mock"
                  ? "Mock AI — demo responses"
                  : "Ask about your soil report"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} aria-label="Clear chat">
          <Eraser className="h-4 w-4" aria-hidden />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 1 && (
          <div className="rounded-xl border border-dashed border-sage bg-ivory p-4 text-center">
            <p className="text-sm text-charcoal/65">
              Start with a question below, or tap one of the suggestions.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                m.role === "assistant" ? "bg-forest text-ivory" : "bg-sage text-forest"
              )}
              aria-hidden
            >
              {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "assistant"
                  ? "rounded-tl-sm bg-ivory text-charcoal"
                  : "rounded-tr-sm bg-forest text-ivory"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2.5" aria-label="Assistant is typing">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-ivory" aria-hidden>
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-ivory px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-forest/60"
                  style={{ animationDelay: `${i * 150}ms` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion chips */}
      <div className="border-t border-sage px-4 pt-3">
        <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={typing}
              className="rounded-full border border-sage bg-ivory px-3 py-1.5 text-xs font-medium text-forest transition-colors hover:bg-sage disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-2 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask the soil assistant
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={initialLang === "te" ? "మీ ప్రశ్న ఇక్కడ టైప్ చేయండి…" : "Type your question…"}
          className="h-10 flex-1 rounded-xl border border-sage bg-ivory px-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none"
          autoComplete="off"
        />
        <Button type="submit" disabled={!input.trim() || typing} aria-label="Send message">
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
