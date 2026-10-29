"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BACKEND_CONFIGURED,
  getSatelliteSoil,
  type SatelliteProperty,
  type SatelliteResponse,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Satellite } from "lucide-react";

/** Satellite soil check (ISRIC SoilGrids, modelled estimates ~250 m).
 *
 *  SoilGrids gives ONLY pH, OC, N (g/kg — NOT kg/ha), clay, sand, CEC.
 *  It does NOT give P, K, EC, or micronutrients, and this component never
 *  invents them: they get their own "Not measured by satellite" panel.
 *
 *  Guidance bands below are ROUGH guides for modelled satellite values
 *  only — not lab standards, and the panel says so. They exist so a farmer
 *  gets "if this is high / if this is low" direction, not a dose: no
 *  fertilizer quantity is ever computed from satellite values. */

type Band = "low" | "medium" | "high";

function bandFor(parameter: string, value: number): Band {
  switch (parameter) {
    case "pH":
      return value < 5.5 ? "low" : value > 7.5 ? "high" : "medium";
    case "OC":
      return value < 0.5 ? "low" : value > 0.75 ? "high" : "medium";
    case "N":
      // Total N in g/kg (satellite) — NOT available N in kg/ha.
      return value < 1 ? "low" : value > 2 ? "high" : "medium";
    case "clay":
      return value < 20 ? "low" : value > 40 ? "high" : "medium";
    case "sand":
      return value < 30 ? "low" : value > 70 ? "high" : "medium";
    case "CEC":
      return value < 10 ? "low" : value > 25 ? "high" : "medium";
    default:
      return "medium";
  }
}

const GUIDANCE: Record<string, { label: string; low: string; medium: string; high: string }> = {
  pH: {
    label: "pH (acidity)",
    low: "Acidic soil. Of the three crops, paddy tolerates mild acidity best. Lime can help, but only after a lab test confirms the acidity — never lime on a satellite estimate alone.",
    medium: "Near neutral — comfortable for paddy, cotton and chilli alike. Keep the lab test for the exact fertilizer dose.",
    high: "Alkaline soil. Cotton generally handles alkaline soils better than chilli. Check salinity and drainage with a lab test before sowing.",
  },
  OC: {
    label: "Organic carbon",
    low: "Low organic matter. Add farmyard manure, compost, or a green manure crop — this builds soil structure and helps the soil hold water and nutrients.",
    medium: "Moderate organic matter. Keep it up with regular manure or compost and crop residue left in the field.",
    high: "Good organic matter. Keep the practice going — manure, compost and residue return are what maintain it.",
  },
  N: {
    label: "Nitrogen (total, g/kg)",
    low: "Low total nitrogen estimate. Crops here will likely need nitrogen fertilizer — but this number is total N in g/kg, NOT the available N in kg/ha on a lab report, so it cannot set any dose.",
    medium: "Moderate total nitrogen estimate. Still not a fertilizer dose: only a lab N value in kg/ha can set how much urea to apply.",
    high: "High total nitrogen estimate. That does not mean skip nitrogen fertilizer — total N and plant-available N are different things, and only a lab test tells you the available part.",
  },
  clay: {
    label: "Clay content",
    low: "Light soil. It drains fast and holds less water and nutrients — prefer split fertilizer doses and add organic matter.",
    medium: "Balanced texture. Holds water reasonably while still draining — suitable for all three crops with normal care.",
    high: "Heavy soil. Holds water well but drains slowly — avoid waterlogging for cotton and chilli; paddy handles standing water best.",
  },
  sand: {
    label: "Sand content",
    low: "Low sand — a heavier soil that holds water longer. Watch drainage after heavy rain, especially for chilli.",
    medium: "Moderate sand. Drains and holds water in balance — normal irrigation planning applies.",
    high: "Very sandy soil. It dries quickly and loses nutrients fast — irrigate more often and split fertilizer into smaller doses.",
  },
  CEC: {
    label: "CEC (nutrient-holding capacity)",
    low: "Low nutrient-holding capacity. Fertilizer washes away easily — split doses into smaller applications instead of one big dose.",
    medium: "Moderate nutrient-holding capacity. Normal split dosing works well.",
    high: "Good nutrient-holding capacity. The soil keeps nutrients longer, so standard dosing schedules are safer here.",
  },
};

const NOT_MEASURED = ["Phosphorus (P)", "Potassium (K)", "EC (salinity)", "Micronutrients (S, Zn, Fe, B, Mn, Cu)"];

/** Group per-depth properties by parameter; guidance uses the mean of the
 *  depths, labelled as such — never a single depth dressed up as "the" value. */
function groupProperties(props: SatelliteProperty[]): { parameter: string; unit: string; readings: { depth: string; value: number }[]; mean: number }[] {
  const map = new Map<string, { unit: string; readings: { depth: string; value: number }[] }>();
  for (const p of props) {
    const entry = map.get(p.parameter) ?? { unit: p.unit, readings: [] };
    entry.readings.push({ depth: p.depth, value: p.value });
    map.set(p.parameter, entry);
  }
  return [...map.entries()].map(([parameter, entry]) => ({
    parameter,
    unit: entry.unit,
    readings: entry.readings,
    mean: entry.readings.reduce((sum, r) => sum + r.value, 0) / entry.readings.length,
  }));
}

export function SatelliteCheck() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<SatelliteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    const la = Number(lat);
    const lo = Number(lon);
    if (Number.isNaN(la) || Number.isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      setError("Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    setPhase("loading");
    setError(null);
    setResult(null);
    try {
      setResult(await getSatelliteSoil(la, lo));
    } catch {
      setError("Satellite check is unavailable — is the backend running?");
    } finally {
      setPhase("done");
    }
  }

  const grouped = result?.available && result.properties ? groupProperties(result.properties) : [];

  return (
    <section aria-labelledby="satellite-heading" className="mt-10">
      <h2 id="satellite-heading" className="flex items-center gap-2 font-display text-2xl font-semibold text-charcoal">
        <Satellite className="size-5 text-forest" aria-hidden />
        Satellite soil check
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
        No lab report? Enter your field&apos;s latitude and longitude for a
        rough modelled background from ISRIC SoilGrids. This is{" "}
        <span className="font-semibold text-charcoal">not a soil test</span> — it
        only covers a few parameters, at about 250&nbsp;m resolution.
      </p>

      {!BACKEND_CONFIGURED && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-charcoal/75">
          Demo mode: the backend is not connected, so the satellite check needs
          NEXT_PUBLIC_API_URL set in frontend/.env.local and the backend running.
        </p>
      )}

      <form
        className="mt-5 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
      >
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude, e.g. 17.68"
          aria-label="Latitude"
          className="min-w-0 flex-1 rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <input
          type="number"
          step="any"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="Longitude, e.g. 83.22"
          aria-label="Longitude"
          className="min-w-0 flex-1 rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <Button type="submit" disabled={phase === "loading" || !lat || !lon}>
          {phase === "loading" ? "Checking…" : "Check my field"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && !result.available && (
        <div className="mt-6 rounded-2xl border border-sage bg-white p-5">
          <p className="text-sm text-charcoal/75">{result.reason}</p>
          <ul className="mt-3 space-y-1">
            {result.disclaimers.map((d) => (
              <li key={d} className="text-xs leading-relaxed text-charcoal/55">· {d}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.available && (
        <div className="mt-6 space-y-6">
          <p className="rounded-xl border border-sage bg-white p-4 text-xs leading-relaxed text-charcoal/60">
            Source: {result.source} · Resolution ~{result.resolution_m} m · Modelled
            estimates, not lab measurements. Nitrogen is in g/kg and cannot be
            compared with lab kg/ha values. Bands below are rough guides for
            modelled values only — not lab standards — and no fertilizer dose is
            computed from them.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {grouped.map((g) => {
              const guide = GUIDANCE[g.parameter];
              if (!guide) return null;
              const band = bandFor(g.parameter, g.mean);
              const text = band === "low" ? guide.low : band === "high" ? guide.high : guide.medium;
              return (
                <article key={g.parameter} className="rounded-2xl border border-sage bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-charcoal">
                      {guide.label}
                    </h3>
                    <span className="shrink-0 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-semibold text-forest">
                      {band === "low" ? "Low" : band === "high" ? "High" : "Medium"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-charcoal/70">
                    Modelled average {g.mean.toFixed(g.parameter === "pH" ? 2 : 3)} {g.unit}
                    {" "}— average of{" "}
                    {g.readings.map((r) => `${r.depth}: ${r.value}`).join(", ")}.
                  </p>
                  {g.parameter === "N" && (
                    <p className="mt-2 rounded-lg bg-gold/15 px-3 py-2 text-xs font-semibold text-charcoal/75">
                      g/kg, NOT kg/ha — do not compare with lab kg/ha values.
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{text}</p>
                </article>
              );
            })}
          </div>

          {/* What satellite cannot measure — never invented. */}
          <div className="rounded-2xl border border-gold/50 bg-gold/10 p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-charcoal">
              Not measured by satellite
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
              Satellite data cannot measure these at all. Without them, no
              fertilizer dose can be set — only direction, not quantities.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {NOT_MEASURED.map((item) => (
                <li key={item} className="rounded-full border border-gold/50 bg-white px-3 py-1 text-xs font-semibold text-charcoal">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/soil-report"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              Upload a lab report to get these values →
            </Link>
          </div>

          <ul className="space-y-1">
            {result.disclaimers.map((d) => (
              <li key={d} className="text-xs leading-relaxed text-charcoal/55">· {d}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
