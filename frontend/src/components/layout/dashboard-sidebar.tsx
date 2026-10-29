"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Calculator,
  CalendarDays,
  CloudSun,
  Droplets,
  FileUp,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings,
  Sprout,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Soil Reports", href: "/soil-report", icon: FileUp },
  { label: "Soil Health", href: "/soil-analysis", icon: FlaskConical },
  { label: "Crop Recommendations", href: "/recommendations", icon: Wheat },
  { label: "My Crop", href: "/my-crop", icon: Sprout },
  { label: "Fertilizer Planner", href: "/recommendations", icon: Calculator },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Zone & Water", href: "/zone-water", icon: Droplets },
  { label: "Crop Calendar", href: "/crop-calendar", icon: CalendarDays },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface DashboardSidebarProps {
  /** Drawer open state (all screen sizes). */
  open: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    store.clear();
    onClose();
    router.push("/");
  };

  const nav = (
    <div className="flex h-full flex-col bg-pine text-ivory">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5"
          aria-label="SasyaSakhi home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-leaf/20 ring-1 ring-leaf/40">
            <Sprout className="size-5 text-leaf" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight">
              SasyaSakhi
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-ivory/60">
              Demo
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-ivory/70 hover:bg-forest hover:text-ivory"
          aria-label="Close navigation menu"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {/* Nav */}
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={`${item.label}-${item.href}`}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-leaf/25 text-ivory ring-1 ring-leaf/40"
                      : "text-ivory/70 hover:bg-forest hover:text-ivory",
                  )}
                >
                  <Icon
                    className={cn("size-4.5 shrink-0", active ? "text-gold" : "text-ivory/50")}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t border-forest px-3 py-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ivory/70 transition-colors hover:bg-forest hover:text-ivory"
        >
          <LogOut className="size-4.5 shrink-0 text-ivory/50" aria-hidden />
          Sign out
        </button>
        <p className="mt-3 px-3.5 text-[11px] leading-relaxed text-ivory/40">
          Demo prototype — no real account data.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-pine/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer (all screen sizes, opened by the hamburger) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
        aria-label="Dashboard navigation"
        inert={!open}
      >
        {nav}
      </aside>
    </>
  );
}
