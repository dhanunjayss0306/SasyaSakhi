"use client";

import { useEffect, useState } from "react";
import { getWeather } from "@/lib/mock-weather-service";
import type { WeatherDay } from "@/lib/mock-data";
import { Cloud, CloudRain, CloudSun, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<WeatherDay["icon"], typeof Sun> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  "cloud-rain": CloudRain,
  cloud: Cloud,
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-sage bg-white p-5" aria-hidden>
      <div className="h-4 w-16 rounded bg-sage" />
      <div className="mt-4 h-10 w-10 rounded-full bg-sage" />
      <div className="mt-4 h-5 w-24 rounded bg-sage" />
      <div className="mt-2 h-3 w-32 rounded bg-sage" />
      <div className="mt-4 h-3 w-full rounded bg-sage" />
    </div>
  );
}

export default function WeatherPage() {
  const [days, setDays] = useState<WeatherDay[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getWeather()
      .then((w) => {
        if (alive) setDays(w);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Weather</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
            5-day outlook with field advice. Plan spraying and fertilizer around the rain.
          </p>
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
          Demo data
        </span>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-semibold">Could not load the weather.</p>
          <p className="mt-1">This is a prototype with demo data — please try reloading the page.</p>
        </div>
      )}

      {!error && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {days === null
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : days.map((d, i) => {
                const Icon = ICONS[d.icon];
                return (
                  <article
                    key={d.day}
                    className={cn(
                      "rounded-2xl border p-5",
                      i === 0 ? "border-forest bg-forest text-ivory shadow-md" : "border-sage bg-white"
                    )}
                  >
                    <p className={cn("text-xs font-semibold uppercase tracking-wide", i === 0 ? "text-gold" : "text-forest")}>
                      {d.day}
                    </p>
                    <Icon className={cn("mt-3 h-10 w-10", i === 0 ? "text-gold" : "text-forest")} aria-hidden />
                    <p className="mt-3 font-display text-2xl font-semibold">
                      {d.tempHigh}°<span className={cn("text-base font-normal", i === 0 ? "text-ivory/70" : "text-charcoal/55")}> / {d.tempLow}°</span>
                    </p>
                    <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium", i === 0 ? "text-ivory/85" : "text-charcoal/70")}>
                      <CloudRain className="h-3.5 w-3.5" aria-hidden />
                      {d.rainChance}% rain
                    </p>
                    <p className={cn("mt-3 border-t pt-3 text-xs leading-relaxed", i === 0 ? "border-ivory/20 text-ivory/85" : "border-sage text-charcoal/70")}>
                      {d.advice}
                    </p>
                  </article>
                );
              })}
        </div>
      )}
    </div>
  );
}
