"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

const TITLE_BY_PATH: Record<string, string> = {
  "/dashboard": "Overview",
  "/soil-report": "Soil Reports",
  "/soil-analysis": "Soil Health",
  "/recommendations": "Crop & Fertilizer Recommendations",
  "/weather": "Weather",
  "/zone-water": "Zone & Water",
  "/crop-calendar": "Crop Calendar",
  "/assistant": "AI Assistant",
  "/settings": "Settings",
};

function titleForPath(pathname: string): string {
  if (TITLE_BY_PATH[pathname]) return TITLE_BY_PATH[pathname];
  const match = Object.keys(TITLE_BY_PATH)
    .filter((p) => p !== "/dashboard" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLE_BY_PATH[match] : "Dashboard";
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <DashboardHeader
          title={titleForPath(pathname)}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
