"use client";

import { useState } from "react";
import { Sprout } from "lucide-react";

export function Footer() {
  // `typeof window` guard: `new Date()` must never evaluate during prerender (Next 16).
  const [year] = useState(() =>
    typeof window === "undefined" ? 2026 : new Date().getFullYear()
  );

  return (
    <footer className="bg-forest text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-ivory text-forest">
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
                <a href="/dashboard" className="text-ivory/80 hover:text-ivory">
                  Open the demo dashboard
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Contact">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ivory/50">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:hello@sasyasakhi.example"
                  className="text-ivory/80 hover:text-ivory"
                >
                  Email the team
                </a>
              </li>
              <li>
                <a href="/assistant" className="text-ivory/80 hover:text-ivory">
                  Farmer support
                </a>
              </li>
              <li>
                <a href="#prototype-note" className="text-ivory/80 hover:text-ivory">
                  Privacy (prototype note)
                </a>
              </li>
              <li>
                <a href="#prototype-note" className="text-ivory/80 hover:text-ivory">
                  Terms (prototype note)
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p
            id="prototype-note"
            className="text-xs leading-relaxed text-ivory/50"
          >
            SasyaSakhi is a hackathon prototype. Recommendations depend on
            the data available and are illustrative only — please confirm
            important decisions with your local agricultural officer. Privacy
            and Terms notices will be published with the first release.
          </p>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 text-xs text-ivory/50 sm:flex-row sm:items-center">
            <p>© {year} SasyaSakhi. All rights reserved.</p>
            <p>Built for farmers, starting in Andhra Pradesh.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
