"use client";

import { useEffect, useMemo, useState } from "react";
import { getCalendarEvents } from "@/lib/mock-weather-service";
import type { CalendarEvent } from "@/lib/mock-data";
import { CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function monthKey(date: string) {
  return date.slice(0, 7); // "2026-10"
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function dayLabel(date: string) {
  // Parse at noon to avoid timezone day-shift on the ISO date.
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-xl border border-sage bg-white p-4" aria-hidden>
      <div className="h-4 w-2/3 rounded bg-sage" />
      <div className="mt-2 h-3 w-1/3 rounded bg-sage" />
    </div>
  );
}

export default function CropCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    getCalendarEvents()
      .then((list) => {
        if (!alive) return;
        setEvents(list);
        setDone(Object.fromEntries(list.map((e, i) => [`${e.date}-${i}`, e.done])));
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    if (!events) return [];
    const map = new Map<string, { event: CalendarEvent; key: string }[]>();
    events.forEach((event, i) => {
      const key = `${event.date}-${i}`;
      const mk = monthKey(event.date);
      if (!map.has(mk)) map.set(mk, []);
      map.get(mk)!.push({ event, key });
    });
    return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }, [events]);

  const toggle = (key: string) => setDone((prev) => ({ ...prev, [key]: !prev[key] }));
  const completedCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Crop calendar</h1>
          <p className="mt-1 text-sm text-charcoal/65">
            {events ? `${completedCount} of ${events.length} tasks done` : "Your season tasks, month by month."}
          </p>
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
          Demo data
        </span>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-semibold">Could not load the calendar.</p>
          <p className="mt-1">This is a prototype with demo data — please try reloading the page.</p>
        </div>
      )}

      {!error && (
        <div className="mt-6 space-y-8">
          {events === null
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            : grouped.map(([mk, list]) => (
                <section key={mk} aria-labelledby={`month-${mk}`}>
                  <h2 id={`month-${mk}`} className="flex items-center gap-2 font-display text-lg font-semibold text-forest">
                    <CalendarDays className="h-5 w-5" aria-hidden />
                    {monthLabel(mk)}
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {list.map(({ event, key }) => {
                      const checked = !!done[key];
                      return (
                        <li
                          key={key}
                          className={cn(
                            "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                            checked ? "border-leaf/60 bg-sage/50" : "border-sage bg-white"
                          )}
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`Mark "${event.title}" as ${checked ? "not done" : "done"}`}
                            onClick={() => toggle(key)}
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                              checked ? "border-forest bg-forest text-ivory" : "border-charcoal/30 bg-white"
                            )}
                          >
                            {checked && <Check className="h-4 w-4" aria-hidden />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={cn("font-medium text-charcoal", checked && "line-through text-charcoal/50")}>
                              {event.title}
                            </p>
                            <p className={cn("text-sm", checked ? "text-charcoal/40" : "text-forest/75")}>
                              {event.titleTe}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">{dayLabel(event.date)}</p>
                            <p className="mt-0.5 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                              {event.crop}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
        </div>
      )}
    </div>
  );
}
