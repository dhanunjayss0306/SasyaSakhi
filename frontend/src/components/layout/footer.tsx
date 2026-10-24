"use client";

import { useState } from "react";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";

type Lang = "en" | "te";

function FooterLanguageSelector() {
  const [lang, setLang] = useState<Lang>(() => store.getLang());

  const choose = (next: Lang) => {
    setLang(next);
    store.setLang(next);
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1 rounded-full border border-charcoal/15 bg-ivory p-1 text-sm"
    >
      {(["en", "te"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            lang === l
              ? "bg-forest text-ivory"
              : "text-charcoal/70 hover:text-charcoal",
          )}
        >
          {l === "en" ? "EN" : "తెలుగు"}
        </button>
      ))}
    </div>
  );
}

export function Footer() {
  // `typeof window` guard: `new Date()` must never evaluate during prerender (Next 16).
  const [year] = useState(() =>
    typeof window === "undefined" ? 2026 : new Date().getFullYear()
  );

  return (
    <footer className="bg-pine text-ivory">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-leaf/25 text-leaf">
                <Sprout className="size-5" aria-hidden />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">
                SasyaSakhi
              </span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/70">
              Your soil. Our support. Better farming. SasyaSakhi reads your
              soil test reports and turns them into clear, practical guidance —
              in English and Telugu.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ivory/50">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#features" className="text-ivory/80 hover:text-ivory">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-ivory/80 hover:text-ivory">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#crops" className="text-ivory/80 hover:text-ivory">
                  Crops
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@sasyasakhi.example"
                  className="text-ivory/80 hover:text-ivory"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ivory/50">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#prototype-note" className="text-ivory/80 hover:text-ivory">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#prototype-note" className="text-ivory/80 hover:text-ivory">
                  Terms
                </a>
              </li>
            </ul>
            <div className="mt-5">
              <FooterLanguageSelector />
            </div>
          </div>
        </div>

        <div
          id="prototype-note"
          className="mt-12 rounded-2xl border border-gold/30 bg-gold/10 p-5 text-sm leading-relaxed text-ivory/80"
        >
          <h2 className="font-semibold text-gold">Prototype note</h2>
          <p className="mt-1">
            SasyaSakhi is a hackathon prototype. Recommendations depend on
            the data available and are illustrative only — please confirm
            important decisions with your local agricultural officer. Privacy
            and Terms notices will be published with the first release.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ivory/50 sm:flex-row sm:items-center">
          <p>© {year} SasyaSakhi. All rights reserved.</p>
          <p>Built for farmers, starting in Andhra Pradesh.</p>
        </div>
      </div>
    </footer>
  );
}
