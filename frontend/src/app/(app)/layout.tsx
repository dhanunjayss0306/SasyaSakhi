"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SakhiPet } from "@/components/assistant/sakhi-pet";
import { useStoredLang, type Lang } from "@/lib/store";

/** Page titles in both languages — Telugu mode must translate the
 *  header title too, not just the page body. */
const TITLE_BY_PATH: Record<string, { en: string; te: string }> = {
  "/dashboard": { en: "Overview", te: "డాష్‌బోర్డ్" },
  "/soil-report": { en: "Soil Reports", te: "నేల నివేదికలు" },
  "/soil-analysis": { en: "Soil Health", te: "నేల ఆరోగ్యం" },
  "/my-crop": { en: "My Crop Care", te: "నా పంట సంరక్షణ" },
  "/recommendations": { en: "Crop Recommendations", te: "పంట సిఫార్సులు" },
  "/fertilizer-planner": { en: "Fertilizer Planner", te: "ఎరువుల ప్రణాళిక" },
  "/weather": { en: "Weather", te: "వాతావరణం" },
  "/zone-water": { en: "Zone & Water", te: "జోన్ & నీరు" },
  "/crop-calendar": { en: "Crop Calendar", te: "పంట క్యాలెండర్" },
  "/assistant": { en: "Sakhi Assistant", te: "సఖి సహాయకుడు" },
  "/settings": { en: "Settings", te: "సెట్టింగ్‌లు" },
};

function titleForPath(pathname: string, lang: Lang): string {
  const fallback = lang === "te" ? "డాష్‌బోర్డ్" : "Dashboard";
  if (TITLE_BY_PATH[pathname]) return TITLE_BY_PATH[pathname][lang];
  const match = Object.keys(TITLE_BY_PATH)
    .filter((p) => p !== "/dashboard" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLE_BY_PATH[match][lang] : fallback;
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lang = useStoredLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <DashboardHeader
          title={titleForPath(pathname, lang)}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 sm:pt-8">
          {children}
        </main>
      </div>
      {/* Sakhi pet: every app page except the assistant page itself, where
          the chat is already open. Bottom padding above keeps it off the
          content on mobile. */}
      {pathname !== "/assistant" && <SakhiPet />}
    </div>
  );
}
