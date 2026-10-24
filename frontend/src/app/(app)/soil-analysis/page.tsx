"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Leaf, Sprout } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SoilParameterCard } from "@/components/soil/soil-parameter-card";
import { store } from "@/lib/store";
import { SAMPLE_SOIL_REPORT, MOCK_NOTICE } from "@/lib/mock-data";
import type { SoilReport } from "@/types/soil";

type Verdict = { title: string; detail: string; tone: "good" | "mixed" | "attention" };

function deriveVerdict(report: SoilReport): Verdict {
  const counts = report.parameters.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  const total = report.parameters.length;
  if ((counts.optimal ?? 0) === total) {
    return {
      title: "Healthy soil",
      detail:
        "Every measured value sits in its ideal range. Keep your current practices and re-test next season.",
      tone: "good",
    };
  }
  if ((counts.low ?? 0) + (counts.high ?? 0) >= 2) {
    return {
      title: "Needs attention",
      detail:
        "Two or more values are outside their ideal range. Targeted fertilizer doses should bring them back in line.",
      tone: "attention",
    };
  }
  return {
    title: "Good, with minor fixes",
    detail:
      "Most values are healthy. One small correction will put the soil in great shape for this season.",
    tone: "mixed",
  };
}

/** Typical N/P/K range chart (kg/ha) — illustrative demo scales. */
const NPK_RANGES: Record<string, { max: number; low: number; high: number; label: string }> = {
  n: { max: 700, low: 280, high: 560, label: "Nitrogen (N)" },
  p: { max: 60, low: 12, high: 25, label: "Phosphorus (P)" },
  k: { max: 450, low: 110, high: 280, label: "Potassium (K)" },
};

function NpkBar({ paramKey, value }: { paramKey: string; value: number | null }) {
  const range = NPK_RANGES[paramKey];
  const pct = (v: number) => Math.min(100, Math.max(0, (v / range.max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-charcoal">{range.label}</p>
        <p className="text-sm text-charcoal/70">
          {value === null ? "—" : `${value} kg/ha`}
        </p>
      </div>
      <div
        role="img"
        aria-label={`${range.label}: ${value ?? "no"} kg/ha. Typical range ${range.low} to ${range.high} kg/ha.`}
        className="relative mt-2 h-3 rounded-full bg-sage"
      >
        <div
          className="absolute top-0 h-full rounded-full bg-leaf/50"
          style={{ left: `${pct(range.low)}%`, width: `${pct(range.high) - pct(range.low)}%` }}
        />
        {value !== null && (
          <div
            className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest"
            style={{ left: `${pct(value)}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-charcoal/50">
        <span>0</span>
        <span className="text-leaf">green band = typical range</span>
        <span>{range.max}</span>
      </div>
    </div>
  );
}

const AFFECTS = [
  {
    title: "Organic matter",
    detail:
      "Regular farmyard manure or compost raises organic carbon, which improves every other value on this page.",
  },
  {
    title: "Fertilizer balance",
    detail:
      "Over-using urea (nitrogen) without matching phosphorus and potassium pushes the soil out of balance.",
  },
  {
    title: "Water and drainage",
    detail:
      "Waterlogging raises salt levels (EC); poor rain leaves nutrients locked where roots cannot reach them.",
  },
  {
    title: "Crop rotation",
    detail:
      "Growing the same crop every season drains the same nutrients. Legumes like groundnut return nitrogen to the soil.",
  },
];

export default function SoilAnalysisPage() {
  const [initial] = useState(() => {
    const stored = store.getReport();
    return { report: stored ?? SAMPLE_SOIL_REPORT, usingSample: stored === null };
  });
  const report = initial.report;
  const usingSample = initial.usingSample;

  if (!report) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10" aria-label="Loading">
        <div className="h-9 w-56 animate-pulse rounded bg-sage" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-sage/60" />
          ))}
        </div>
      </div>
    );
  }

  const verdict = deriveVerdict(report);
  const verdictTone =
    verdict.tone === "good"
      ? "border-leaf/40 bg-leaf/10"
      : verdict.tone === "attention"
        ? "border-red-200 bg-red-50"
        : "border-gold/40 bg-gold/10";
  const npk = report.parameters.filter((p) => ["n", "p", "k"].includes(p.key));
  // The report's notice tells us whether these values came from the demo
  // fallback (MOCK_NOTICE) or a real backend extraction.
  const isDemo = report.mockNotice === MOCK_NOTICE;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Soil Analysis
          </h1>
          <p className="mt-1 text-sm text-charcoal/70">
            Based on <span className="font-medium">{report.fileName}</span>
            {usingSample && " (sample report — you have not uploaded one yet)"}
          </p>
        </div>
        <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-ivory">
          {isDemo ? "Demo data" : "Live"}
        </span>
      </header>

      {/* Overall verdict */}
      <section
        aria-label="Soil health overview"
        className={`rounded-2xl border p-6 ${verdictTone}`}
      >
        <div className="flex items-center gap-3">
          {verdict.tone === "good" ? (
            <Leaf className="h-8 w-8 text-forest" aria-hidden="true" />
          ) : (
            <Sprout className="h-8 w-8 text-forest" aria-hidden="true" />
          )}
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            {verdict.title}
          </h2>
        </div>
        <p className="mt-2 text-sm text-charcoal/80">{verdict.detail}</p>
      </section>

      {/* Parameter cards */}
      <section aria-label="Soil parameters" className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-charcoal">
          Your soil values
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {report.parameters.map((p) => (
            <SoilParameterCard key={p.key} parameter={p} />
          ))}
        </div>
      </section>

      {/* NPK visualization */}
      <section aria-label="Nitrogen, phosphorus and potassium levels" className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-charcoal">
          N / P / K at a glance
        </h2>
        <div className="space-y-5 rounded-2xl border border-forest/15 bg-white p-5">
          {npk.map((p) => (
            <NpkBar key={p.key} paramKey={p.key} value={p.value} />
          ))}
          <p className="text-xs text-charcoal/60">
            The dark marker shows your value; the green band shows the typical
            range. Scales are illustrative demo ranges.
          </p>
        </div>
      </section>

      {/* What affects this */}
      <section aria-label="What affects soil health" className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-charcoal">
          What affects this
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {AFFECTS.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-forest/15 bg-ivory p-5"
            >
              <h3 className="text-sm font-semibold text-charcoal">{a.title}</h3>
              <p className="mt-1 text-sm text-charcoal/70">{a.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources / assumptions / limitations */}
      <section
        aria-label="Sources, assumptions and limitations"
        className="mt-8 rounded-2xl border border-charcoal/15 bg-white p-6"
      >
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
          <Info className="h-5 w-5" aria-hidden="true" />
          Sources, assumptions &amp; limitations
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-charcoal/80">
          <li>
            <strong>{isDemo ? "Demo data only:" : "Source:"}</strong>{" "}
            {isDemo ? MOCK_NOTICE : report.mockNotice}
          </li>
          <li>
            <strong>Rules-based engine:</strong> statuses (Low / Optimal / High)
            come from fixed agronomy bands, not machine learning. The engine
            explains your values — it never invents them.
          </li>
          <li>
            <strong>Typical ranges</strong> for N/P/K are broad Indian-soil
            benchmarks; your local agriculture officer can refine them for your
            village.
          </li>
          <li>
            <strong>Not a lab substitute:</strong> always confirm fertilizer
            doses with a soil-testing lab or agriculture officer before buying.
          </li>
        </ul>
      </section>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/recommendations"
          className={buttonVariants({ className: "flex-1 bg-forest text-ivory hover:bg-pine" })}
        >
          See crop recommendations
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/assistant"
          className={buttonVariants({
            variant: "outline",
            className: "flex-1",
          })}
        >
          Ask the assistant
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
