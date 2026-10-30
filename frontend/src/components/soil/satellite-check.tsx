"use client";

import { useState } from "react";
import Link from "next/link";
import { useStoredLang } from "@/lib/store";
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

const NOT_MEASURED_TE = ["భాస్వరం (P)", "పొటాషియం (K)", "EC (లవణత)", "సూక్ష్మపోషకాలు (S, Zn, Fe, B, Mn, Cu)"];

/** Telugu versions of the per-parameter guidance, so the satellite panel
 *  is fully Telugu when the toggle is on. */
const GUIDANCE_TE: Record<string, { label: string; low: string; medium: string; high: string }> = {
  pH: {
    label: "pH (ఆమ్లత)",
    low: "ఆమ్ల నేల. మూడు పంటలలో వరి తేలికపాటి ఆమ్లతను బాగా తట్టుకుంటుంది. ల్యాబ్ పరీక్ష ఆమ్లతను నిర్ధారించిన తర్వాత మాత్రమే సున్నం వేయండి — ఉపగ్రహ అంచనాపై మాత్రమే సున్నం వేయకండి.",
    medium: "దాదాపు తటస్థం — వరి, పత్తి మరియు మిరప మూడింటికీ సౌకర్యంగా ఉంటుంది. ఖచ్చితమైన ఎరువు మోతాదు కోసం ల్యాబ్ పరీక్షను ఉంచండి.",
    high: "క్షార నేల. పత్తి సాధారణంగా మిరప కంటే క్షార నేలలను బాగా తట్టుకుంటుంది. విత్తే ముందు లవణత మరియు పారుదలను ల్యాబ్ పరీక్షతో తనిఖీ చేయండి.",
  },
  OC: {
    label: "సేంద్రియ కార్బన్",
    low: "తక్కువ సేంద్రియ పదార్థం. పశువుల ఎరువు, కంపోస్ట్ లేదా పచ్చిరొట్టె పంటను వేయండి — ఇది నేల నిర్మాణాన్ని నిర్మిస్తుంది మరియు నీరు, పోషకాలను పట్టుకోవడంలో సహాయపడుతుంది.",
    medium: "మధ్యస్థ సేంద్రియ పదార్థం. క్రమం తప్పకుండా ఎరువు లేదా కంపోస్ట్ మరియు పొలంలో మిగిలిన పంట అవశేషాలతో దాన్ని కొనసాగించండి.",
    high: "మంచి సేంద్రియ పదార్థం. ఈ పద్ధతిని కొనసాగించండి — ఎరువు, కంపోస్ట్ మరియు అవశేషాల తిరిగి వేయడమే దాన్ని నిర్వహిస్తుంది.",
  },
  N: {
    label: "నత్రజని (మొత్తం, g/kg)",
    low: "తక్కువ మొత్తం నత్రజని అంచనా. ఇక్కడి పంటలకు నత్రజని ఎరువు అవసరం కావచ్చు — కానీ ఈ సంఖ్య g/kgలో మొత్తం N, ల్యాబ్ నివేదికలో kg/haలో అందుబాటులో ఉన్న N కాదు, కాబట్టి ఇది ఏ మోతాదును నిర్ణయించలేదు.",
    medium: "మధ్యస్థ మొత్తం నత్రజని అంచనా. అయినా ఇది ఎరువు మోతాదు కాదు: kg/haలో ల్యాబ్ N విలువ మాత్రమే ఎంత యూరియా వేయాలో నిర్ణయిస్తుంది.",
    high: "అధిక మొత్తం నత్రజని అంచనా. దీని అర్థం నత్రజని ఎరువును వదిలేయాలని కాదు — మొత్తం N మరియు మొక్కకు అందుబాటులో ఉన్న N వేర్వేరు, మరియు అందుబాటులో ఉన్న భాగాన్ని ల్యాబ్ పరీక్ష మాత్రమే చెబుతుంది.",
  },
  clay: {
    label: "బంకమట్టి శాతం",
    low: "తేలికపాటి నేల. ఇది త్వరగా నీటిని పారుతుంది మరియు తక్కువ నీరు, పోషకాలను పట్టుకుంటుంది — విడివిడిగా ఎరువు మోతాదులు వేయండి మరియు సేంద్రియ పదార్థం జోడించండి.",
    medium: "సమతుల్య నిర్మాణం. నీటిని సహేతుకంగా పట్టుకుంటూనే పారుతుంది — సాధారణ జాగ్రత్తతో మూడు పంటలకూ అనుకూలం.",
    high: "భారీ నేల. నీటిని బాగా పట్టుకుంటుంది కానీ నెమ్మదిగా పారుతుంది — పత్తి మరియు మిరపకు నీటి నిల్వను నివారించండి; వరి నిలిచిన నీటిని బాగా తట్టుకుంటుంది.",
  },
  sand: {
    label: "ఇసుక శాతం",
    low: "తక్కువ ఇసుక — ఎక్కువసేపు నీటిని పట్టుకునే భారీ నేల. భారీ వర్షం తర్వాత పారుదలను గమనించండి, ముఖ్యంగా మిరపకు.",
    medium: "మధ్యస్థ ఇసుక. నీటిని పారించడం మరియు పట్టుకోవడం సమతుల్యంగా ఉంటుంది — సాధారణ నీటిపారుదల ప్రణాళిక వర్తిస్తుంది.",
    high: "చాలా ఇసుక నేల. ఇది త్వరగా ఎండిపోతుంది మరియు పోషకాలను త్వరగా కోల్పోతుంది — తరచుగా నీరు పెట్టండి మరియు ఎరువును చిన్న మోతాదులుగా విడగొట్టండి.",
  },
  CEC: {
    label: "CEC (పోషకాలను పట్టుకునే సామర్థ్యం)",
    low: "తక్కువ పోషకాలను పట్టుకునే సామర్థ్యం. ఎరువు సులభంగా కొట్టుకుపోతుంది — ఒక పెద్ద మోతాదుకు బదులుగా చిన్న మోతాదులుగా విడగొట్టండి.",
    medium: "మధ్యస్థ పోషకాలను పట్టుకునే సామర్థ్యం. సాధారణ విడివిడి మోతాదులు బాగా పనిచేస్తాయి.",
    high: "మంచి పోషకాలను పట్టుకునే సామర్థ్యం. నేల పోషకాలను ఎక్కువసేపు ఉంచుతుంది, కాబట్టి ప్రామాణిక మోతాదు షెడ్యూల్‌లు సురక్షితంగా ఉంటాయి.",
  },
};

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
  const lang = useStoredLang();
  const te = lang === "te";
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<SatelliteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    const la = Number(lat);
    const lo = Number(lon);
    if (Number.isNaN(la) || Number.isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      setError(te ? "చెల్లుబాటు అయ్యే అక్షాంశం (-90 నుండి 90) మరియు రేఖాంశం (-180 నుండి 180) నమోదు చేయండి." : "Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    setPhase("loading");
    setError(null);
    setResult(null);
    try {
      setResult(await getSatelliteSoil(la, lo));
    } catch {
      setError(te ? "ఉపగ్రహ తనిఖీ అందుబాటులో లేదు — బ్యాకెండ్ నడుస్తుందా?" : "Satellite check is unavailable — is the backend running?");
    } finally {
      setPhase("done");
    }
  }

  const grouped = result?.available && result.properties ? groupProperties(result.properties) : [];

  return (
    <section aria-labelledby="satellite-heading" className="mt-10">
      <h2 id="satellite-heading" className="flex items-center gap-2 font-display text-2xl font-semibold text-charcoal">
        <Satellite className="size-5 text-forest" aria-hidden />
        {te ? "ఉపగ్రహ నేల తనిఖీ" : "Satellite soil check"}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
        {te ? (
          <>ల్యాబ్ నివేదిక లేదా? ISRIC SoilGrids నుండి సుమారు నమూనా నేపథ్యం కోసం మీ పొలం అక్షాంశం మరియు రేఖాంశాన్ని నమోదు చేయండి. ఇది <span className="font-semibold text-charcoal">నేల పరీక్ష కాదు</span> — ఇది కొన్ని పారామితులను మాత్రమే కవర్ చేస్తుంది, సుమారు 250&nbsp;మీ రిజల్యూషన్‌తో.</>
        ) : (
          <>No lab report? Enter your field&apos;s latitude and longitude for a
          rough modelled background from ISRIC SoilGrids. This is{" "}
          <span className="font-semibold text-charcoal">not a soil test</span> — it
          only covers a few parameters, at about 250&nbsp;m resolution.</>
        )}
      </p>

      {!BACKEND_CONFIGURED && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-charcoal/75">
          {te
            ? "డెమో మోడ్: బ్యాకెండ్ కనెక్ట్ చేయబడలేదు, కాబట్టి ఉపగ్రహ తనిఖీకి frontend/.env.localలో NEXT_PUBLIC_API_URL సెట్ చేసి బ్యాకెండ్ నడుస్తుండాలి."
            : "Demo mode: the backend is not connected, so the satellite check needs NEXT_PUBLIC_API_URL set in frontend/.env.local and the backend running."}
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
          placeholder={te ? "అక్షాంశం, ఉదా. 17.68" : "Latitude, e.g. 17.68"}
          aria-label={te ? "అక్షాంశం" : "Latitude"}
          className="min-w-0 flex-1 rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <input
          type="number"
          step="any"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder={te ? "రేఖాంశం, ఉదా. 83.22" : "Longitude, e.g. 83.22"}
          aria-label={te ? "రేఖాంశం" : "Longitude"}
          className="min-w-0 flex-1 rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <Button type="submit" disabled={phase === "loading" || !lat || !lon}>
          {phase === "loading" ? (te ? "తనిఖీ చేస్తున్నాము…" : "Checking…") : te ? "నా పొలాన్ని తనిఖీ చేయండి" : "Check my field"}
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
            {te ? (
              <>మూలం: {result.source} · రిజల్యూషన్ ~{result.resolution_m} మీ · నమూనా అంచనాలు, ల్యాబ్ కొలతలు కాదు. నత్రజని g/kgలో ఉంది మరియు ల్యాబ్ kg/ha విలువలతో పోల్చలేము. కింద బ్యాండ్‌లు నమూనా విలువలకు మాత్రమే సుమారు మార్గదర్శకాలు — ల్యాబ్ ప్రమాణాలు కాదు — మరియు వాటి నుండి ఏ ఎరువు మోతాదు లెక్కించబడదు.</>
            ) : (
              <>Source: {result.source} · Resolution ~{result.resolution_m} m · Modelled
              estimates, not lab measurements. Nitrogen is in g/kg and cannot be
              compared with lab kg/ha values. Bands below are rough guides for
              modelled values only — not lab standards — and no fertilizer dose is
              computed from them.</>
            )}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {grouped.map((g) => {
              const guide = te ? GUIDANCE_TE[g.parameter] : GUIDANCE[g.parameter];
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
                      {band === "low" ? (te ? "తక్కువ" : "Low") : band === "high" ? (te ? "ఎక్కువ" : "High") : te ? "మధ్యస్థం" : "Medium"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-charcoal/70">
                    {te ? (
                      <>నమూనా సగటు {g.mean.toFixed(g.parameter === "pH" ? 2 : 3)} {g.unit} — {g.readings.map((r) => `${r.depth}: ${r.value}`).join(", ")} సగటు.</>
                    ) : (
                      <>Modelled average {g.mean.toFixed(g.parameter === "pH" ? 2 : 3)} {g.unit}
                      {" "}— average of{" "}
                      {g.readings.map((r) => `${r.depth}: ${r.value}`).join(", ")}.</>
                    )}
                  </p>
                  {g.parameter === "N" && (
                    <p className="mt-2 rounded-lg bg-gold/15 px-3 py-2 text-xs font-semibold text-charcoal/75">
                      {te ? "g/kg, kg/ha కాదు — ల్యాబ్ kg/ha విలువలతో పోల్చవద్దు." : "g/kg, NOT kg/ha — do not compare with lab kg/ha values."}
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
              {te ? "ఉపగ్రహం ద్వారా కొలవబడలేదు" : "Not measured by satellite"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
              {te
                ? "ఉపగ్రహ డేటా వీటిని అస్సలు కొలవలేదు. వీటి లేకుండా, ఏ ఎరువు మోతాదును నిర్ణయించలేము — పరిమాణాలు కాదు, దిశ మాత్రమే."
                : "Satellite data cannot measure these at all. Without them, no fertilizer dose can be set — only direction, not quantities."}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(te ? NOT_MEASURED_TE : NOT_MEASURED).map((item) => (
                <li key={item} className="rounded-full border border-gold/50 bg-white px-3 py-1 text-xs font-semibold text-charcoal">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/soil-report"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              {te ? "ఈ విలువలను పొందడానికి ల్యాబ్ నివేదికను అప్‌లోడ్ చేయండి →" : "Upload a lab report to get these values →"}
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
