"use client";

import Link from "next/link";
import { ArrowRight, Info, Leaf, Sprout } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SoilParameterCard } from "@/components/soil/soil-parameter-card";
import { useStoredLang, useStoredReport } from "@/lib/store";
import { SAMPLE_SOIL_REPORT, MOCK_NOTICE } from "@/lib/mock-data";
import type { SoilReport } from "@/types/soil";

type Verdict = {
  title: { en: string; te: string };
  detail: { en: string; te: string };
  tone: "good" | "mixed" | "attention";
};

function deriveVerdict(report: SoilReport): Verdict {
  const counts = report.parameters.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  const total = report.parameters.length;
  if ((counts.optimal ?? 0) === total) {
    return {
      title: { en: "Healthy soil", te: "ఆరోగ్యకరమైన నేల" },
      detail: {
        en: "Every measured value sits in its ideal range. Keep your current practices and re-test next season.",
        te: "కొలిచిన ప్రతి విలువ ఆదర్శ పరిధిలో ఉంది. మీ ప్రస్తుత పద్ధతులను కొనసాగించి, వచ్చే సీజన్‌లో మళ్ళీ పరీక్షించండి.",
      },
      tone: "good",
    };
  }
  if ((counts.low ?? 0) + (counts.high ?? 0) >= 2) {
    return {
      title: { en: "Needs attention", te: "శ్రద్ధ అవసరం" },
      detail: {
        en: "Two or more values are outside their ideal range. Targeted fertilizer doses should bring them back in line.",
        te: "రెండు లేదా అంతకంటే ఎక్కువ విలువలు ఆదర్శ పరిధికి వెలుపల ఉన్నాయి. లక్ష్య ఎరువుల మోతాదులు వాటిని తిరిగి సరిచేయాలి.",
      },
      tone: "attention",
    };
  }
  return {
    title: { en: "Good, with minor fixes", te: "మంచిది, చిన్న సరిదిద్దులతో" },
    detail: {
      en: "Most values are healthy. One small correction will put the soil in great shape for this season.",
      te: "చాలా విలువలు ఆరోగ్యకరంగా ఉన్నాయి. ఒక చిన్న సరిదిద్దుడు ఈ సీజన్‌కు నేలను గొప్ప స్థితిలో ఉంచుతుంది.",
    },
    tone: "mixed",
  };
}

/** Typical N/P/K range chart (kg/ha) — illustrative demo scales. */
const NPK_RANGES: Record<string, { max: number; low: number; high: number; label: { en: string; te: string } }> = {
  n: { max: 700, low: 280, high: 560, label: { en: "Nitrogen (N)", te: "నత్రజని (N)" } },
  p: { max: 60, low: 12, high: 25, label: { en: "Phosphorus (P)", te: "భాస్వరం (P)" } },
  k: { max: 450, low: 110, high: 280, label: { en: "Potassium (K)", te: "పొటాషియం (K)" } },
};

function NpkBar({ paramKey, value, te }: { paramKey: string; value: number | null; te: boolean }) {
  const range = NPK_RANGES[paramKey];
  const label = te ? range.label.te : range.label.en;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / range.max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="text-sm text-charcoal/70">
          {value === null ? "—" : `${value} kg/ha`}
        </p>
      </div>
      <div
        role="img"
        aria-label={
          te
            ? `${label}: ${value ?? "లేదు"} kg/ha. సాధారణ పరిధి ${range.low} నుండి ${range.high} kg/ha.`
            : `${label}: ${value ?? "no"} kg/ha. Typical range ${range.low} to ${range.high} kg/ha.`
        }
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
        <span className="text-leaf">{te ? "ఆకుపచ్చ బ్యాండ్ = సాధారణ పరిధి" : "green band = typical range"}</span>
        <span>{range.max}</span>
      </div>
    </div>
  );
}

const AFFECTS = [
  {
    title: { en: "Organic matter", te: "సేంద్రీయ పదార్థం" },
    detail: {
      en: "Regular farmyard manure or compost raises organic carbon, which improves every other value on this page.",
      te: "క్రమం తప్పకుండా పశువుల ఎరువు లేదా కంపోస్ట్ సేంద్రీయ కార్బన్‌ను పెంచుతుంది, ఇది ఈ పేజీలోని ప్రతి ఇతర విలువను మెరుగుపరుస్తుంది.",
    },
  },
  {
    title: { en: "Fertilizer balance", te: "ఎరువుల సమతుల్యత" },
    detail: {
      en: "Over-using urea (nitrogen) without matching phosphorus and potassium pushes the soil out of balance.",
      te: "భాస్వరం మరియు పొటాషియంతో సరిపోల్చకుండా యూరియా (నత్రజని) అతిగా వాడటం నేలను సమతుల్యత నుండి తప్పిస్తుంది.",
    },
  },
  {
    title: { en: "Water and drainage", te: "నీరు మరియు పారుదల" },
    detail: {
      en: "Waterlogging raises salt levels (EC); poor rain leaves nutrients locked where roots cannot reach them.",
      te: "నీరు నిల్వ ఉండటం ఉప్పు స్థాయిలను (EC) పెంచుతుంది; తక్కువ వర్షం పోషకాలను వేర్లు చేరలేని చోట బంధిస్తుంది.",
    },
  },
  {
    title: { en: "Crop rotation", te: "పంట మార్పిడి" },
    detail: {
      en: "Growing the same crop every season drains the same nutrients. Legumes like groundnut return nitrogen to the soil.",
      te: "ప్రతి సీజన్‌లో ఒకే పంట వేయడం అదే పోషకాలను ఖాళీ చేస్తుంది. వేరుశెనగ వంటి పప్పు పంటలు నత్రజనిని నేలకు తిరిగి ఇస్తాయి.",
    },
  },
];

const TE_MOCK_NOTICE =
  "డెమో డేటా — ఇది ఒక నమూనా. విలువలు ఉదాహరణ నమూనాలు మాత్రమే, ల్యాబ్ ఫలితాలు కావు.";

export default function SoilAnalysisPage() {
  // Hydration-safe: the stored report exists only on the client; reading it
  // in a useState initializer rendered the stored report on the client
  // while the server rendered the sample report.
  const stored = useStoredReport();
  const lang = useStoredLang();
  const te = lang === "te";
  const report = stored ?? SAMPLE_SOIL_REPORT;
  const usingSample = stored === null;

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
            {te ? "నేల విశ్లేషణ" : "Soil Analysis"}
          </h1>
          <p className="mt-1 text-sm text-charcoal/70">
            {te ? "ఆధారం:" : "Based on"}{" "}
            <span className="font-medium">{report.fileName}</span>
            {usingSample &&
              (te
                ? " (నమూనా నివేదిక — మీరు ఇంకా అప్‌లోడ్ చేయలేదు)"
                : " (sample report — you have not uploaded one yet)")}
          </p>
        </div>
        <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-ivory">
          {isDemo ? (te ? "డెమో డేటా" : "Demo data") : te ? "ప్రత్యక్షం" : "Live"}
        </span>
      </header>

      {/* Overall verdict */}
      <section
        aria-label={te ? "నేల ఆరోగ్య అవలోకనం" : "Soil health overview"}
        className={`rounded-2xl border p-6 ${verdictTone}`}
      >
        <div className="flex items-center gap-3">
          {verdict.tone === "good" ? (
            <Leaf className="h-8 w-8 text-forest" aria-hidden="true" />
          ) : (
            <Sprout className="h-8 w-8 text-forest" aria-hidden="true" />
          )}
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            {te ? verdict.title.te : verdict.title.en}
          </h2>
        </div>
        <p className="mt-2 text-sm text-charcoal/80">{te ? verdict.detail.te : verdict.detail.en}</p>
      </section>

      {/* Parameter cards */}
      <section aria-label={te ? "నేల పారామితులు" : "Soil parameters"} className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-charcoal">
          {te ? "మీ నేల విలువలు" : "Your soil values"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {report.parameters.map((p) => (
            <SoilParameterCard key={p.key} parameter={p} />
          ))}
        </div>
      </section>

      {/* NPK visualization */}
      <section aria-label={te ? "నత్రజని, భాస్వరం మరియు పొటాషియం స్థాయిలు" : "Nitrogen, phosphorus and potassium levels"} className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-charcoal">
          {te ? "N / P / K ఒక చూపులో" : "N / P / K at a glance"}
        </h2>
        <div className="space-y-5 rounded-2xl border border-forest/15 bg-white p-5">
          {npk.map((p) => (
            <NpkBar key={p.key} paramKey={p.key} value={p.value} te={te} />
          ))}
          <p className="text-xs text-charcoal/60">
            {te
              ? "ముదురు గుర్తు మీ విలువను చూపిస్తుంది; ఆకుపచ్చ బ్యాండ్ సాధారణ పరిధిని చూపిస్తుంది. స్కేల్‌లు ఉదాహరణ డెమో పరిధులు."
              : "The dark marker shows your value; the green band shows the typical range. Scales are illustrative demo ranges."}
          </p>
        </div>
      </section>

      {/* What affects this */}
      <section aria-label={te ? "నేల ఆరోగ్యాన్ని ప్రభావితం చేసేవి" : "What affects soil health"} className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-charcoal">
          {te ? "దీన్ని ప్రభావితం చేసేవి" : "What affects this"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {AFFECTS.map((a) => (
            <div
              key={a.title.en}
              className="rounded-2xl border border-forest/15 bg-ivory p-5"
            >
              <h3 className="text-sm font-semibold text-charcoal">{te ? a.title.te : a.title.en}</h3>
              <p className="mt-1 text-sm text-charcoal/70">{te ? a.detail.te : a.detail.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources / assumptions / limitations */}
      <section
        aria-label={te ? "మూలాలు, ఊహలు మరియు పరిమితులు" : "Sources, assumptions and limitations"}
        className="mt-8 rounded-2xl border border-charcoal/15 bg-white p-6"
      >
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
          <Info className="h-5 w-5" aria-hidden="true" />
          {te ? "మూలాలు, ఊహలు & పరిమితులు" : "Sources, assumptions & limitations"}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-charcoal/80">
          <li>
            <strong>{isDemo ? (te ? "డెమో డేటా మాత్రమే:" : "Demo data only:") : te ? "మూలం:" : "Source:"}</strong>{" "}
            {isDemo ? (te ? TE_MOCK_NOTICE : MOCK_NOTICE) : report.mockNotice}
          </li>
          <li>
            <strong>{te ? "నియమాల ఆధారిత ఇంజిన్:" : "Rules-based engine:"}</strong>{" "}
            {te
              ? "స్థితులు (తక్కువ / ఆదర్శం / ఎక్కువ) స్థిర వ్యవసాయ బ్యాండ్‌ల నుండి వస్తాయి, మెషిన్ లెర్నింగ్ నుండి కాదు. ఇంజిన్ మీ విలువలను వివరిస్తుంది — వాటిని ఎప్పుడూ కల్పించదు."
              : "statuses (Low / Optimal / High) come from fixed agronomy bands, not machine learning. The engine explains your values — it never invents them."}
          </li>
          <li>
            <strong>{te ? "సాధారణ పరిధులు" : "Typical ranges"}</strong>{" "}
            {te
              ? "N/P/K కోసం విస్తృత భారతీయ-నేల ప్రమాణాలు; మీ స్థానిక వ్యవసాయ అధికారి మీ గ్రామం కోసం వాటిని మెరుగుపరచగలరు."
              : "for N/P/K are broad Indian-soil benchmarks; your local agriculture officer can refine them for your village."}
          </li>
          <li>
            <strong>{te ? "ల్యాబ్‌కు ప్రత్యామ్నాయం కాదు:" : "Not a lab substitute:"}</strong>{" "}
            {te
              ? "కొనే ముందు ఎరువుల మోతాదులను ఎల్లప్పుడూ నేల పరీక్ష ల్యాబ్ లేదా వ్యవసాయ అధికారితో నిర్ధారించుకోండి."
              : "always confirm fertilizer doses with a soil-testing lab or agriculture officer before buying."}
          </li>
        </ul>
      </section>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/recommendations"
          className={buttonVariants({ className: "flex-1 bg-forest text-ivory hover:bg-pine" })}
        >
          {te ? "పంట సిఫార్సులు చూడండి" : "See crop recommendations"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/assistant"
          className={buttonVariants({
            variant: "outline",
            className: "flex-1",
          })}
        >
          {te ? "సహాయకుడిని అడగండి" : "Ask the assistant"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
