"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sprout, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { store, useStoredLang } from "@/lib/store";

const NAV_LINKS = [
  { href: "#top", label: "Home", labelTe: "హోమ్" },
  { href: "#features", label: "Features", labelTe: "ఫీచర్లు" },
  { href: "#how-it-works", label: "How It Works", labelTe: "ఎలా పనిచేస్తుంది" },
  { href: "#crops", label: "Crops", labelTe: "పంటలు" },
  { href: "#about", label: "About", labelTe: "గురించి" },
];

type Lang = "en" | "te";

function LanguageSelector({ onSelect }: { onSelect?: () => void }) {
  const lang = useStoredLang();

  const choose = (next: Lang) => {
    store.setLang(next);
    onSelect?.();
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center rounded-full border border-charcoal/15 bg-cream p-0.5 text-xs font-medium"
    >
      {(["en", "te"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors",
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

export function Navbar() {
  const [open, setOpen] = useState(false);
  const lang = useStoredLang();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-charcoal/10 bg-cream">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <Link
          href="#top"
          className="flex items-center gap-2.5 text-charcoal"
          aria-label="SasyaSakhi — home"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-forest text-ivory">
            <Sprout className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            SasyaSakhi
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-charcoal/80 transition-colors hover:bg-forest/5 hover:text-charcoal"
              >
                {lang === "te" ? link.labelTe : link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector />
          <Link
            href="/login"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "rounded-full border-charcoal/20 bg-cream text-charcoal hover:bg-forest/5 hover:text-charcoal",
              }),
            )}
          >
            {lang === "te" ? "సైన్ ఇన్" : "Sign In"}
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({
                size: "sm",
                className: "rounded-full bg-gold text-charcoal hover:bg-gold/90",
              }),
            )}
          >
            {lang === "te" ? "ప్రారంభించండి" : "Get Started"}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSelector />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-charcoal hover:bg-forest/5 hover:text-charcoal"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </Button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-charcoal/10 bg-cream px-4 pb-5 pt-2 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-charcoal/90 transition-colors hover:bg-forest/5"
                >
                  {lang === "te" ? link.labelTe : link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "flex-1 rounded-full border-charcoal/20 bg-cream text-charcoal hover:bg-forest/5 hover:text-charcoal",
                }),
              )}
            >
              {lang === "te" ? "సైన్ ఇన్" : "Sign In"}
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({
                  className: "flex-1 rounded-full bg-gold text-charcoal hover:bg-gold/90",
                }),
              )}
            >
              {lang === "te" ? "ప్రారంభించండి" : "Get Started"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
