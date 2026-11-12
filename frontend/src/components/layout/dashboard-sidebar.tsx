"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Calculator,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Droplets,
  FileUp,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Sprout,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store, useStoredLang } from "@/lib/store";

interface NavSubItem {
  label: string;
  labelTe: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  labelTe: string;
  icon: LucideIcon;
  /** Direct link when the group is a single page (Overview). */
  href?: string;
  items?: NavSubItem[];
}

/** Sidebar order follows the preview's app shell, grouped into five
 *  top-level sections so the menu stays short:
 *  - "My Crop" stays: it is one of the features the user changed, so it
 *    keeps its place even though the preview list does not name it.
 *  - "Season Tracker" has no dedicated route, so it points at the crop
 *    calendar, where season tracking lives.
 *  - "Settings" is not listed here: it already lives in the header's
 *    account menu, one tap away. */
const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", labelTe: "డాష్‌బోర్డ్", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Soil",
    labelTe: "నేల",
    icon: FlaskConical,
    items: [
      { label: "Soil Reports", labelTe: "నేల నివేదికలు", href: "/soil-report", icon: FileUp },
      { label: "Soil Health", labelTe: "నేల ఆరోగ్యం", href: "/soil-analysis", icon: FlaskConical },
    ],
  },
  {
    label: "Crops",
    labelTe: "పంటలు",
    icon: Wheat,
    items: [
      { label: "Crop Recommendations", labelTe: "పంట సిఫార్సులు", href: "/recommendations", icon: Wheat },
      { label: "My Crop", labelTe: "నా పంట", href: "/my-crop", icon: Sprout },
      { label: "Fertilizer Planner", labelTe: "ఎరువుల ప్రణాళిక", href: "/fertilizer-planner", icon: Calculator },
      { label: "Crop Calendar", labelTe: "పంట క్యాలెండర్", href: "/crop-calendar", icon: CalendarDays },
      { label: "Season Tracker", labelTe: "సీజన్ ట్రాకర్", href: "/crop-calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Field",
    labelTe: "పొలం",
    icon: CloudSun,
    items: [
      { label: "Weather", labelTe: "వాతావరణం", href: "/weather", icon: CloudSun },
      { label: "Zone & Water", labelTe: "జోన్ & నీరు", href: "/zone-water", icon: Droplets },
    ],
  },
  {
    label: "Sakhi",
    labelTe: "సఖి",
    icon: Bot,
    items: [
      { label: "Sakhi Assistant", labelTe: "సఖి సహాయకుడు", href: "/assistant", icon: Bot },
    ],
  },
];

function groupForPath(pathname: string): NavGroup | undefined {
  return NAV_GROUPS.find(
    (g) =>
      (g.href !== undefined && pathname === g.href) ||
      g.items?.some(
        (item) =>
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href)),
      ),
  );
}

function isItemActive(item: NavSubItem, pathname: string): boolean {
  return (
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
}

interface DashboardSidebarProps {
  /** Drawer open state (small screens only — the sidebar is always
   *  visible on desktop). */
  open: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useStoredLang();

  const activeGroup = groupForPath(pathname);
  // Groups the user opened by hand. The group of the current page is
  // always expanded unless the user just closed it on this exact page
  // (recorded in `closedFor`, which stops applying after navigation).
  // Everything is derived during render — no effect needed.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const [closedFor, setClosedFor] = useState<{ label: string; path: string } | null>(null);

  const isExpanded = (group: NavGroup): boolean =>
    (openGroups.has(group.label) || activeGroup?.label === group.label) &&
    !(closedFor?.label === group.label && closedFor.path === pathname);

  const toggleGroup = (label: string) => {
    const isActiveGroup = activeGroup?.label === label;
    const currentlyExpanded = openGroups.has(label) || isActiveGroup;
    if (currentlyExpanded) {
      setOpenGroups((prev) => {
        const next = new Set(prev);
        next.delete(label);
        return next;
      });
      if (isActiveGroup) setClosedFor({ label, path: pathname });
    } else {
      setOpenGroups((prev) => new Set(prev).add(label));
      if (closedFor?.label === label) setClosedFor(null);
    }
  };

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
          <span className="flex size-10 items-center justify-center rounded-full bg-leaf/25 text-leaf">
            <Sprout className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            SasyaSakhi
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-ivory/85 hover:bg-forest hover:text-ivory lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {/* Nav — five top-level sections; groups expand to their pages. */}
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {NAV_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const groupActive =
              (group.href !== undefined && pathname === group.href) ||
              group.items?.some((item) => isItemActive(item, pathname));
            const expanded = isExpanded(group);
            if (group.href !== undefined) {
              const active = pathname === group.href;
              return (
                <li key={group.label} className="relative">
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold"
                    />
                  )}
                  <Link
                    href={group.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-forest text-ivory"
                        : "text-ivory/85 hover:bg-forest hover:text-ivory",
                    )}
                  >
                    <GroupIcon
                      className={cn("size-4.5 shrink-0", active ? "text-gold" : "text-ivory/70")}
                      aria-hidden
                    />
                    {lang === "te" ? group.labelTe : group.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={expanded}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    groupActive
                      ? "bg-forest text-ivory"
                      : "text-ivory/85 hover:bg-forest hover:text-ivory",
                  )}
                >
                  <GroupIcon
                    className={cn("size-4.5 shrink-0", groupActive ? "text-gold" : "text-ivory/70")}
                    aria-hidden
                  />
                  <span className="flex-1 text-left">
                    {lang === "te" ? group.labelTe : group.label}
                  </span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {expanded && (
                  <ul className="mt-1 space-y-1 border-l border-forest pl-3">
                    {group.items?.map((item) => {
                      const active = isItemActive(item, pathname);
                      const Icon = item.icon;
                      return (
                        <li key={`${item.label}-${item.href}`} className="relative">
                          {active && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold"
                            />
                          )}
                          <Link
                            href={item.href}
                            onClick={onClose}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-forest text-ivory"
                                : "text-ivory/85 hover:bg-forest hover:text-ivory",
                            )}
                          >
                            <Icon
                              className={cn("size-4.5 shrink-0", active ? "text-gold" : "text-ivory/70")}
                              aria-hidden
                            />
                            {lang === "te" ? item.labelTe : item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out + demo badge */}
      <div className="border-t border-forest px-3 py-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ivory/85 transition-colors hover:bg-forest hover:text-ivory"
        >
          <LogOut className="size-4.5 shrink-0 text-ivory/70" aria-hidden />
          {lang === "te" ? "సైన్ అవుట్" : "Sign out"}
        </button>
        <p className="mt-3 px-3.5">
          <span className="inline-flex rounded-full bg-forest px-3 py-1 text-[11px] font-semibold tracking-widest text-gold">
            {lang === "te" ? "డెమో బిల్డ్" : "DEMO BUILD"}
          </span>
        </p>
        <p className="mt-2 px-3.5 text-[11px] leading-relaxed text-ivory/60">
          {lang === "te"
            ? "డెమో నమూనా — నిజమైన ఖాతా డేటా లేదు."
            : "Demo prototype — no real account data."}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed sidebar on desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block"
        aria-label="Dashboard navigation"
      >
        {nav}
      </aside>

      {/* Backdrop + drawer on small screens */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-pine/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 lg:hidden",
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
