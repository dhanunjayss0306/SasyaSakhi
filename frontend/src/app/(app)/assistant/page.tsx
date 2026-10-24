"use client";

import { useState } from "react";
import { store, type Lang } from "@/lib/store";
import { ChatWindow } from "@/components/assistant/chat-window";
import { cn } from "@/lib/utils";

export default function AssistantPage() {
  const [lang, setLang] = useState<Lang>(() => store.getLang());

  const pick = (l: Lang) => {
    store.setLang(l);
    setLang(l);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">AI Assistant</h1>
          <p className="mt-1 text-sm text-charcoal/65">
            Ask about your soil report in English or Telugu. Responses are scripted demos.
          </p>
        </div>
        <div role="group" aria-label="Assistant language" className="flex rounded-full border border-sage bg-ivory p-1">
          {(
            [
              { code: "en", label: "EN" },
              { code: "te", label: "తెలుగు" },
            ] as { code: Lang; label: string }[]
          ).map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => pick(opt.code)}
              aria-pressed={lang === opt.code}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                lang === opt.code ? "bg-forest text-ivory" : "text-forest hover:bg-sage"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <ChatWindow key={lang} initialLang={lang} />
      </div>
    </div>
  );
}
