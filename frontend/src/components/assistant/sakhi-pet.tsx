"use client";

import Link from "next/link";
import { useStoredLang } from "@/lib/store";

/** Sakhi, the leaf companion: ONE floating button, bottom-right on app
 *  pages. CSS/SVG only — no image files. Tapping it opens the existing
 *  assistant chat. The app shell hides it on the assistant page itself
 *  (the chat is already open there) and reserves bottom padding on mobile
 *  so it never covers page content. */
export function SakhiPet() {
  const lang = useStoredLang();
  return (
    <Link
      href="/assistant"
      aria-label={lang === "te" ? "సఖి సహాయకుడు తెరవండి" : "Open Sakhi assistant"}
      className="fixed bottom-5 right-5 z-40 flex w-16 flex-col items-center gap-0.5 rounded-3xl bg-forest py-2.5 text-ivory shadow-xl shadow-pine/30 ring-2 ring-leaf/60 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <span className="relative flex size-9 items-center justify-center" aria-hidden>
        {/* Leaf body */}
        <svg viewBox="0 0 48 48" className="size-9" fill="none">
          <path
            d="M24 4C12 12 8 22 10 32c1 6 6 10 12 11 8 1 16-5 18-14 2-9-4-19-16-25Z"
            fill="#69A66B"
          />
          <path
            d="M24 10v28M24 20l-8-5M24 26l9-6"
            stroke="#09271D"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Face */}
          <circle cx="20" cy="26" r="2" fill="#09271D" />
          <circle cx="30" cy="26" r="2" fill="#09271D" />
          <path
            d="M21 31c1.5 1.5 4.5 1.5 6 0"
            stroke="#09271D"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-[11px] font-bold leading-none tracking-wide">
        Sakhi
      </span>
    </Link>
  );
}
