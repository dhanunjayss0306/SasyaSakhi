"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sprout, X } from "lucide-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { store, useStoredLang } from "@/lib/store";

const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#crops", label: "Crops" },
  { href: "#about", label: "About" },
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
      className="flex items-center rounded-full border border-white/20 bg-white/5 p-0.5 text-xs font-medium"
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
              ? "bg-ivory text-charcoal"
              : "text-ivory/80 hover:text-ivory",
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

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <LiquidGlass
        radius={24}
        className="mx-auto w-full max-w-6xl border border-white/10 bg-pine/60 shadow-lg shadow-pine/20"
        // Fixed dark pine base (pine #09271d at 80%). LiquidGlass's own
        // "pending" mode paints a 12% white wash as an inline style, which
        // beats the bg-pine/60 class — so over the light ivory page top
        // the bar looked white and the ivory text vanished, and it only
        // turned green once dark hero content scrolled underneath it.
        // This explicit base wins over the glass wash in every mode,
        // while the backdrop blur keeps the glass look.
        style={{ backgroundColor: "rgb(9 39 29 / 0.8)" }}
      >
        <nav
          aria-label="Primary"
          className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
        >
          <Link
            href="#top"
            className="flex items-center gap-2.5 text-ivory"
            aria-label="SasyaSakhi — home"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-leaf/25 text-leaf">
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
                  className="rounded-full px-4 py-2 text-sm font-medium text-ivory/85 transition-colors hover:bg-white/10 hover:text-ivory"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSelector />
            <Link
              href="/login"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "text-ivory hover:bg-white/10 hover:text-ivory",
              })}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({
                size: "sm",
                className: "bg-leaf text-pine hover:bg-leaf/90",
              })}
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-ivory hover:bg-white/10 hover:text-ivory"
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
          <div id="mobile-menu" className="border-t border-white/10 px-4 pb-5 pt-2 lg:hidden">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-base font-medium text-ivory/90 transition-colors hover:bg-white/10"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "flex-1 border-white/20 bg-transparent text-ivory hover:bg-white/10 hover:text-ivory",
                })}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  className: "flex-1 bg-leaf text-pine hover:bg-leaf/90",
                })}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </LiquidGlass>
    </header>
  );
}
