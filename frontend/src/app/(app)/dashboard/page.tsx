"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  FileText,
  FlaskConical,
  Sparkles,
  Sun,
  Upload,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { cn } from "@/lib/utils";
import { useStoredLang, useStoredReport, useStoredUser } from "@/lib/store";
import { BACKEND_CONFIGURED } from "@/lib/api-client";
import {
  CROPS,
  MOCK_CALENDAR,
  MOCK_NOTICE,
  MOCK_REPORT_HISTORY,
  MOCK_WEATHER,
  SAMPLE_SOIL_REPORT,
  type WeatherDay,
} from "@/lib/mock-data";
import type { ParamStatus } from "@/types/soil";

const STATUS_STYLE: Record<ParamStatus, string> = {
  optimal: "bg-leaf/15 text-[#2E6B40] ring-leaf/40",
  low: "bg-amber-100 text-amber-800 ring-amber-300",
  high: "bg-orange-100 text-orange-800 ring-orange-300",
  unknown: "bg-charcoal/5 text-charcoal/60 ring-charcoal/15",
};

const STATUS_DOT: Record<ParamStatus, string> = {
  optimal: "bg-leaf",
  low: "bg-amber-500",
  high: "bg-orange-500",
  unknown: "bg-charcoal/30",
};

const WEATHER_ICON: Record<WeatherDay["icon"], LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  "cloud-rain": CloudRain,
  cloud: Cloud,
};

type Daypart = "morning" | "afternoon" | "evening";

const GREETINGS: Record<Daypart, { en: string; te: string }> = {
  morning: { en: "Good morning", te: "శుభోదయం" },
  afternoon: { en: "Good afternoon", te: "శుభ మధ్యాహ్నం" },
  evening: { en: "Good evening", te: "శుభ సాయంత్రం" },
};

function daypartForHour(h: number): Daypart {
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

/** Telugu display strings for values that arrive in English from mock data. */
const STATUS_TE: Record<ParamStatus, string> = {
  optimal: "ఆదర్శం",
  low: "తక్కువ",
  high: "ఎక్కువ",
  unknown: "తెలియదు",
};

const WATER_TE: Record<string, string> = {
  High: "ఎక్కువ",
  Medium: "మధ్యస్థం",
  Low: "తక్కువ",
};

const DAY_TE: Record<string, string> = {
  Today: "ఈరోజు",
  Sat: "శని",
  Sun: "ఆది",
  Mon: "సోమ",
  Tue: "మంగళ",
  Wed: "బుధ",
  Thu: "గురు",
  Fri: "శుక్ర",
};

const ADVICE_TE: Record<string, string> = {
  "Good day for field work.": "పొలం పనులకు మంచి రోజు.",
  "Ideal for spraying in the morning.": "ఉదయం పిచికారీకి అనుకూలం.",
  "Hold fertilizer application; rain likely.": "ఎరువు వేయడం ఆపండి; వర్షం అవకాశం ఉంది.",
  "Check drainage in low patches.": "తక్కువ ప్రాంతాల్లో నీటి పారుదల తనిఖీ చేయండి.",
  "Resume field operations.": "పొలం పనులు తిరిగి ప్రారంభించండి.",
};

const TE_MOCK_NOTICE =
  "డెమో డేటా — ఇది ఒక నమూనా. విలువలు ఉదాహరణ నమూనాలు మాత్రమే, ల్యాబ్ ఫలితాలు కావు.";

const MONTH_TE: Record<string, string> = {
  Jan: "జన",
  Feb: "ఫిబ్ర",
  Mar: "మార్చి",
  Apr: "ఏప్రి",
  May: "మే",
  Jun: "జూన్",
  Jul: "జులై",
  Aug: "ఆగ",
  Sep: "సెప్టెం",
  Oct: "అక్టో",
  Nov: "నవం",
  Dec: "డిసెం",
};

function seasonTe(season: string): string {
  let out = season.replace("Kharif", "ఖరీఫ్").replace("Rabi", "రబీ");
  for (const [en, t] of Object.entries(MONTH_TE)) out = out.replace(en, t);
  return out;
}

/** "20 Oct 2026" → "20 అక్టో 2026" for the report-history date line. */
function reportDateTe(date: string): string {
  const parts = date.split(" ");
  if (parts.length === 3 && MONTH_TE[parts[1]]) {
    return `${parts[0]} ${MONTH_TE[parts[1]]} ${parts[2]}`;
  }
  return date;
}

const CROP_TE: Record<string, string> = {
  Paddy: "వరి",
  Cotton: "పత్తి",
  Chilli: "మిరప",
  All: "అన్నీ",
};

const emptySubscribe = () => () => {};

function getDaypartSnapshot(): Daypart {
  if (typeof window === "undefined") return "morning";
  return daypartForHour(new Date().getHours());
}

export default function DashboardPage() {
  const storedUser = useStoredUser();
  const lang = useStoredLang();
  const te = lang === "te";
  const name = storedUser?.name ?? (te ? "అతిథి రైతు" : "Guest Farmer");
  // The greeting depends on the client's clock, which the server cannot
  // know; reading the real hour during render mismatched the server's
  // "Good morning" in afternoons/evenings. useSyncExternalStore renders
  // with the server snapshot ("morning") during hydration, then the real
  // daypart, without a hydration error.
  const daypart = useSyncExternalStore(
    emptySubscribe,
    getDaypartSnapshot,
    () => "morning" as Daypart,
  );
  const greeting = GREETINGS[daypart];

  useEffect(() => {
    document.title = te ? "డాష్‌బోర్డ్ · SasyaSakhi" : "Overview · SasyaSakhi";
  }, [te]);

  const latestReport = MOCK_REPORT_HISTORY[0];
  const upcoming = MOCK_CALENDAR.filter((e) => !e.done).slice(0, 3);
  const weatherSlice = MOCK_WEATHER.slice(0, 3);
  // After a real upload, the dashboard shows YOUR report (values +
  // parameters) instead of the sample — weather, calendar and crop
  // matches below stay sample data, and the badge says so.
  const storedReport = useStoredReport();
  const displayReport = storedReport ?? SAMPLE_SOIL_REPORT;
  // A stored report is NOT automatically a live one: when a backend
  // extraction fails, the upload flow stores the demo sample instead, and
  // that used to be badged "Live report" here. Only a report whose notice
  // is not the demo notice counts as live (same rule as soil-analysis).
  const isLiveReport =
    storedReport !== null && storedReport.mockNotice !== MOCK_NOTICE;
  const latestFileName = storedReport?.fileName ?? latestReport.fileName;
  const latestDate = storedReport
    ? new Date(storedReport.uploadedAt).toLocaleDateString(te ? "te-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : te
      ? reportDateTe(latestReport.date)
      : latestReport.date;
  const latestStatusEn = isLiveReport
    ? "Your report"
    : storedReport
      ? "Sample values"
      : latestReport.status;
  const latestStatus =
    te && latestStatusEn === "Your report"
      ? "మీ నివేదిక"
      : te && latestStatusEn === "Sample values"
        ? "నమూనా విలువలు"
        : te && latestStatusEn === "Analyzed"
          ? "విశ్లేషించబడింది"
          : latestStatusEn;

  return (
    <div className="space-y-8">
      {/* Demo badge + notice */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-[#8A6A2F] ring-1 ring-gold/50"
          title={te ? TE_MOCK_NOTICE : MOCK_NOTICE}
        >
          <BadgeCheck className="size-3.5" aria-hidden />
          {isLiveReport ? (te ? "ప్రత్యక్ష నివేదిక" : "Live report") : te ? "డెమో డేటా" : "Demo data"}
        </span>
        <p className="text-xs text-charcoal/60">
          {isLiveReport
            ? te
              ? "మీరు అప్‌లోడ్ చేసిన నివేదిక చూపబడుతోంది. కింద వాతావరణం, క్యాలెండర్ మరియు పంట సరిపోలికలు ఇంకా నమూనా డేటానే."
              : "Showing your uploaded report. Weather, calendar and crop matches below are still sample data."
            : storedReport
              ? te
                ? "మీ అప్‌లోడ్ చదవబడలేదు, కాబట్టి బదులుగా నమూనా విలువలు చూపబడుతున్నాయి. స్పష్టమైన ఫోటో లేదా PDF ప్రయత్నించండి."
                : "Your upload could not be read, so sample values are shown instead. Try a clearer photo or PDF."
              : te
                ? TE_MOCK_NOTICE
                : MOCK_NOTICE}
        </p>
      </div>

      {/* Greeting + CTA */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-sm font-medium uppercase tracking-wider text-leaf">
            {te ? "మీ పొలం డాష్‌బోర్డ్" : "Your farm dashboard"}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
            {te ? greeting.te : greeting.en}, {name}
          </h2>
          <p className="mt-2 text-sm text-charcoal/60">
            {te
              ? "డెమో పొలం · ఆంధ్రప్రదేశ్ — అంతటా నమూనా డేటా చూపబడుతోంది."
              : "Demo farm · Andhra Pradesh — sample data shown throughout."}
          </p>

          {/* Latest report card */}
          <Link
            href="/soil-report"
            className="mt-6 block rounded-2xl border border-sage bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest/10">
                  <FileText className="size-5 text-forest" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-charcoal/50">
                    {te ? "తాజా నేల నివేదిక" : "Latest soil report"}
                  </p>
                  <p className="mt-1 font-medium text-charcoal">{latestFileName}</p>
                  <p className="mt-0.5 text-sm text-charcoal/60">
                    {latestDate} ·{" "}
                    <span className="font-medium text-[#2E6B40]">{latestStatus}</span>
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-charcoal/40" aria-hidden />
            </div>
          </Link>
        </div>

        {/* Upload CTA */}
        <div className="lg:col-span-2">
          <div className="relative h-full overflow-hidden rounded-3xl bg-pine p-6 text-ivory sm:p-7">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 90% 80% at 80% 10%, rgba(105,166,107,0.35), transparent 65%)",
              }}
              aria-hidden
            />
            <div className="relative flex h-full flex-col">
              <span className="flex size-11 items-center justify-center rounded-xl bg-leaf/20 ring-1 ring-leaf/40">
                <Upload className="size-5 text-leaf" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                {te ? "నేల నివేదిక అప్‌లోడ్ చేయండి" : "Upload Soil Report"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/70">
                {te
                  ? "కొత్త ల్యాబ్ నివేదిక (PDF లేదా ఫోటో) జోడించి, సెకన్లలో తాజా నేల ఆరోగ్య విశ్లేషణ పొందండి."
                  : "Add a new lab report (PDF or photo) and get a fresh soil health analysis in seconds."}
              </p>
              <div className="mt-auto pt-6">
                <Link
                  href="/soil-report"
                  className={cn(buttonVariants({ size: "lg" }), "w-full bg-gold text-pine hover:bg-gold/90")}
                >
                  {te ? "నివేదిక అప్‌లోడ్ చేయండి" : "Upload report"}
                  <ArrowRight aria-hidden />
                </Link>
                <p className="mt-2.5 text-center text-[11px] text-ivory/50">
                  {BACKEND_CONFIGURED
                    ? te
                      ? "అప్‌లోడ్‌లు ప్రత్యక్ష బ్యాకెండ్ ద్వారా ప్రాసెస్ చేయబడతాయి."
                      : "Uploads are processed by the live backend."
                    : te
                      ? "డెమో — అప్‌లోడ్‌లు నిజంగా ప్రాసెస్ చేయబడవు."
                      : "Demo — uploads are not actually processed."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Soil parameters */}
      <section aria-labelledby="params-heading">
        <div className="mb-4 flex items-center justify-between">
          <h3 id="params-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
            <FlaskConical className="size-5 text-forest" aria-hidden />
            {te ? "నేల పారామితులు" : "Soil parameters"}
          </h3>
          <Link href="/soil-analysis" className="text-sm font-semibold text-forest hover:underline">
            {te ? "పూర్తి విశ్లేషణ" : "Full analysis"}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {displayReport.parameters.map((p) => (
            <div
              key={p.key}
              className="rounded-2xl border border-sage bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                  {te ? p.labelTe : p.label}
                </p>
                <span className={`size-2 rounded-full ${STATUS_DOT[p.status]}`} aria-hidden />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-charcoal">
                {p.value ?? "—"}
                {p.unit && (
                  <span className="ml-1 text-xs font-normal text-charcoal/50">{p.unit}</span>
                )}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ${STATUS_STYLE[p.status]}`}
              >
                {te ? STATUS_TE[p.status] : p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Crop recommendations */}
      <section aria-labelledby="crops-heading">
        <div className="mb-4 flex items-center justify-between">
          <h3 id="crops-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
            <Wheat className="size-5 text-forest" aria-hidden />
            {te ? "అగ్ర పంట సరిపోలికలు" : "Top crop matches"}
          </h3>
          <Link href="/recommendations" className="text-sm font-semibold text-forest hover:underline">
            {te ? "అన్ని సిఫార్సులు" : "All recommendations"}
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {CROPS.map((crop) => (
            <article
              key={crop.id}
              className="flex flex-col rounded-2xl border border-sage bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-lg font-semibold text-charcoal">
                    {te ? crop.nameTe : crop.name}
                  </h4>
                  <p className="mt-0.5 text-xs text-charcoal/55">
                    {te ? seasonTe(crop.season) : crop.season} · {te ? "నీరు" : "Water"}:{" "}
                    {te ? (WATER_TE[crop.waterNeed] ?? crop.waterNeed) : crop.waterNeed}
                  </p>
                </div>
                <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-bold text-ivory">
                  {crop.suitability}%
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sage/70" aria-hidden>
                <div
                  className="h-full rounded-full bg-leaf"
                  style={{ width: `${crop.suitability}%` }}
                />
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-charcoal/70">
                {te ? crop.descriptionTe : crop.description}
              </p>
              <Link
                href="/recommendations"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
              >
                {te ? "ప్రణాళిక చూడండి" : "View plan"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Weather + calendar */}
      <section className="grid gap-4 lg:grid-cols-2" aria-label={te ? "వాతావరణం మరియు రాబోయే కార్యకలాపాలు" : "Weather and upcoming activities"}>
        <div className="rounded-2xl border border-sage bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
              <CloudSun className="size-5 text-forest" aria-hidden />
              {te ? "వాతావరణం" : "Weather"}
            </h3>
            <Link href="/weather" className="text-sm font-semibold text-forest hover:underline">
              {te ? "పూర్తి సూచన" : "Full forecast"}
            </Link>
          </div>
          <ul className="divide-y divide-sage/60">
            {weatherSlice.map((w) => {
              const Icon = WEATHER_ICON[w.icon];
              return (
                <li key={w.day} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/60">
                    <Icon className="size-5 text-forest" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-charcoal">{te ? (DAY_TE[w.day] ?? w.day) : w.day}</p>
                    <p className="truncate text-xs text-charcoal/55">{te ? (ADVICE_TE[w.advice] ?? w.advice) : w.advice}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-charcoal">
                      {w.tempHigh}°<span className="text-charcoal/45"> / {w.tempLow}°</span>
                    </p>
                    <p className="flex items-center justify-end gap-1 text-xs text-charcoal/55">
                      <Droplets className="size-3" aria-hidden />
                      {w.rainChance}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-sage bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
              <CalendarDays className="size-5 text-forest" aria-hidden />
              {te ? "రాబోయే కార్యకలాపాలు" : "Upcoming activities"}
            </h3>
            <Link href="/crop-calendar" className="text-sm font-semibold text-forest hover:underline">
              {te ? "పూర్తి క్యాలెండర్" : "Full calendar"}
            </Link>
          </div>
          <ul className="space-y-3">
            {upcoming.map((ev) => (
              <li
                key={ev.date}
                className="flex items-center gap-3.5 rounded-xl bg-ivory px-3.5 py-3"
              >
                <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-forest text-ivory">
                  <span className="text-sm font-bold leading-none">
                    {new Date(`${ev.date}T00:00:00`).getDate()}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase leading-none opacity-75">
                    {new Date(`${ev.date}T00:00:00`).toLocaleString(te ? "te-IN" : "en-IN", { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-charcoal">
                    {te ? ev.titleTe : ev.title}
                  </p>
                  <p className="text-xs text-charcoal/55">{te ? (CROP_TE[ev.crop] ?? ev.crop) : ev.crop}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI assistant teaser */}
      <LiquidGlass
        radius={24}
        className="border border-leaf/30"
        contentClassName="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest">
            <Sparkles className="size-5 text-gold" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-charcoal">
              {te ? "AI సహాయకుడిని అడగండి" : "Ask the AI assistant"}
            </h3>
            <p className="text-sm text-charcoal/60">
              {te
                ? "“నా pH అంటే ఏమిటి?” — మీ నేల డేటా నుండి ఇంగ్లీష్ లేదా తెలుగులో సమాధానాలు."
                : "“What does my pH mean?” — answers in English or Telugu, from your soil data."}
            </p>
          </div>
        </div>
        <Link
          href="/assistant"
          className={cn(buttonVariants(), "shrink-0 bg-forest text-ivory hover:bg-pine")}
        >
          {te ? "సహాయకుడు తెరవండి" : "Open assistant"}
          <ArrowRight aria-hidden />
        </Link>
      </LiquidGlass>
    </div>
  );
}
