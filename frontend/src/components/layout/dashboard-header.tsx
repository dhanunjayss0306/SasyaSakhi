"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Globe, LogOut, Menu, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { store, type Lang } from "@/lib/store";

interface DashboardHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

const DEMO_NOTIFICATIONS = [
  { title: "Soil report analyzed", body: "sample-soil-report.pdf is ready to review." },
  { title: "Rain likely Sunday", body: "Hold fertilizer application — 70% rain chance." },
  { title: "Basal DAP due soon", body: "Scheduled for 26 Oct on your crop calendar." },
];

export function DashboardHeader({ title, onMenuToggle }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>(() => store.getLang());
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Read the client-side store lazily: safe during prerender, no hydration effect needed.
  const [userName] = useState(() => store.getUser()?.name ?? "Guest Farmer");

  // Close dropdowns on outside click / Escape.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    store.setLang(l);
  };

  const handleSignOut = () => {
    store.clear();
    router.push("/");
  };

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((seg) =>
      seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    );

  const initial = (userName || "G").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-sage/70 bg-ivory/90 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-charcoal hover:bg-sage lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={false}
        >
          <Menu className="size-5" aria-hidden />
        </button>

        {/* Title + breadcrumb */}
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="hidden sm:block">
            <ol className="flex items-center gap-1 text-xs text-charcoal/60">
              <li>
                <Link href="/dashboard" className="hover:text-forest hover:underline">
                  SasyaSakhi
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c} className="flex items-center gap-1">
                  <ChevronRight className="size-3" aria-hidden />
                  <span aria-current={c === crumbs[crumbs.length - 1] ? "page" : undefined}>
                    {c}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="truncate font-display text-xl font-semibold tracking-tight text-charcoal sm:text-2xl">
            {title}
          </h1>
        </div>

        {/* Language toggle */}
        <div
          role="group"
          aria-label="Language"
          className="flex items-center rounded-full border border-sage bg-white p-1"
        >
          <Globe className="ml-1.5 size-4 text-charcoal/50" aria-hidden />
          {(
            [
              { code: "en", label: "EN" },
              { code: "te", label: "తెలుగు" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => changeLang(opt.code)}
              aria-pressed={lang === opt.code}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                lang === opt.code
                  ? "bg-forest text-ivory"
                  : "text-charcoal/60 hover:text-charcoal",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-expanded={notifOpen}
            aria-haspopup="true"
            aria-label="Notifications (demo)"
            className="relative rounded-full border border-sage bg-white p-2.5 text-charcoal hover:bg-sage/60"
          >
            <Bell className="size-4.5" aria-hidden />
            <span
              className="absolute right-2 top-2 size-2 rounded-full bg-gold ring-2 ring-white"
              aria-hidden
            />
          </button>
          {notifOpen && (
            <div
              role="menu"
              aria-label="Demo notifications"
              className="absolute right-0 top-12 w-80 overflow-hidden rounded-2xl border border-sage bg-white shadow-xl shadow-forest/10"
            >
              <p className="border-b border-sage/70 bg-sage/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal/70">
                Demo notifications
              </p>
              <ul className="divide-y divide-sage/60">
                {DEMO_NOTIFICATIONS.map((n) => (
                  <li key={n.title} className="px-4 py-3">
                    <p className="text-sm font-semibold text-charcoal">{n.title}</p>
                    <p className="mt-0.5 text-xs text-charcoal/60">{n.body}</p>
                  </li>
                ))}
              </ul>
              <p className="bg-ivory px-4 py-2 text-[11px] text-charcoal/50">
                Demo only — not connected to a real notification service.
              </p>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            aria-expanded={userOpen}
            aria-haspopup="true"
            aria-label="Account menu"
            className="flex items-center gap-2 rounded-full border border-sage bg-white py-1.5 pl-1.5 pr-2.5 hover:bg-sage/60"
          >
            <span
              className="flex size-8 items-center justify-center rounded-full bg-forest font-display text-sm font-semibold text-ivory"
              aria-hidden
            >
              {initial}
            </span>
            <span className="hidden max-w-28 truncate text-sm font-medium text-charcoal md:block">
              {userName}
            </span>
          </button>
          {userOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-sage bg-white shadow-xl shadow-forest/10"
            >
              <div className="flex items-center gap-3 border-b border-sage/70 px-4 py-3">
                <span
                  className="flex size-10 items-center justify-center rounded-full bg-forest font-display text-base font-semibold text-ivory"
                  aria-hidden
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-charcoal">{userName}</p>
                  <p className="text-[11px] text-charcoal/50">Demo account</p>
                </div>
              </div>
              <div className="p-2">
                <Link
                  href="/settings"
                  onClick={() => setUserOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-charcoal hover:bg-sage/60"
                >
                  <UserRound className="size-4 text-charcoal/50" aria-hidden />
                  Profile settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-charcoal hover:bg-sage/60"
                >
                  <LogOut className="size-4 text-charcoal/50" aria-hidden />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
