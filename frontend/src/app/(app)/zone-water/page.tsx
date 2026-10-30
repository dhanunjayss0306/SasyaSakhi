"use client";

import { useState } from "react";
import {
  BACKEND_CONFIGURED,
  zoneLookup,
  type ZoneInfo,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { SatelliteCheck } from "@/components/soil/satellite-check";
import { Droplets } from "lucide-react";
import { useStoredLang } from "@/lib/store";

/** Zone + water lookup: district -> agro-climatic zone, water, crops.
 *  Zone survey data (IMD/CGWB/ICAR), not satellite imagery and not lab
 *  soil values — the card says so every time. */

export default function ZoneWaterPage() {
  const lang = useStoredLang();
  const te = lang === "te";
  const [district, setDistrict] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [zone, setZone] = useState<ZoneInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);

  async function search(value: string) {
    const target = (value || district).trim();
    if (!target) return;
    setPhase("loading");
    setZone(null);
    setMessage(null);
    setCandidates([]);
    try {
      const res = await zoneLookup(target);
      if (res.found && res.zone) {
        setZone(res.zone);
      } else if (res.matches && res.matches.length > 1) {
        setMessage(te ? "ఈ జిల్లాను ఒకటి కంటే ఎక్కువ జోన్‌లు పేర్కొంటున్నాయి — ఒక జోన్‌ను ఎంచుకోండి:" : "More than one zone mentions this district — pick a zone:");
        setCandidates(res.matches.map((m) => m.zone_name));
      } else {
        setMessage(res.message ?? (te ? "ఈ జిల్లాకు జోన్ కనుగొనబడలేదు." : "No zone found for this district."));
        setCandidates(res.candidates ?? []);
      }
    } catch {
      setMessage(te ? "జోన్ వెతకడం అందుబాటులో లేదు — బ్యాకెండ్ నడుస్తుందా?" : "Zone lookup is unavailable — is the backend running?");
    } finally {
      setPhase("done");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        {te ? "జోన్ & నీరు" : "Zone & water"}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
        {te
          ? "మీ జిల్లాను టైప్ చేసి దాని వ్యవసాయ-వాతావరణ జోన్, సీజనల్ నీటి లభ్యత, భూగర్భజల స్థాయి మరియు నీటి-స్థాయి పంట సూచనలను చూడండి. ఇది జోన్ సర్వే డేటా (IMD వర్షపాతం 2011-2025, CGWB భూగర్భజలం), ఉపగ్రహ చిత్రాలు కాదు మరియు ల్యాబ్ నేల విలువలు కాదు."
          : "Type your district to see its agro-climatic zone, seasonal water availability, groundwater stage, and water-tier crop suggestions. This is zone survey data (IMD rainfall 2011-2025, CGWB groundwater), not satellite imagery and not lab soil values."}
      </p>

      {!BACKEND_CONFIGURED && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-charcoal/75">
          {te
            ? "డెమో మోడ్: బ్యాకెండ్ కనెక్ట్ చేయబడలేదు, కాబట్టి జోన్ వెతకడానికి frontend/.env.localలో NEXT_PUBLIC_API_URL సెట్ చేసి బ్యాకెండ్ నడుస్తుండాలి."
            : "Demo mode: the backend is not connected, so zone lookup needs NEXT_PUBLIC_API_URL set in frontend/.env.local and the backend running."}
        </p>
      )}

      <form
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void search(district);
        }}
      >
        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder={te ? "జిల్లా, ఉదా. విశాఖపట్నం" : "District, e.g. Visakhapatnam"}
          aria-label={te ? "జిల్లా" : "District"}
          className="min-w-0 flex-1 rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <Button type="submit" disabled={phase === "loading" || !district.trim()}>
          {phase === "loading" ? (te ? "వెతుకుతున్నాము…" : "Searching…") : te ? "నా జోన్ కనుగొనండి" : "Find my zone"}
        </Button>
      </form>

      {message && (
        <div className="mt-6 rounded-xl border border-sage bg-white p-5">
          <p className="text-sm text-charcoal/75">{message}</p>
          {candidates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {candidates.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setDistrict(c);
                    void search(c);
                  }}
                  className="rounded-full border border-forest/30 px-3 py-1 text-xs font-semibold text-forest hover:bg-sage/50"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {zone && (
        <article className="mt-6 rounded-2xl border border-sage bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest/10">
              <Droplets className="size-5 text-forest" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-charcoal">
                {zone.zone_name}
              </h2>
              <p className="text-sm text-charcoal/60">
                {zone.zone_id} · {zone.state} · {te ? "జిల్లాలు:" : "Districts:"} {zone.districts}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-ivory p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                {te ? "ప్రధాన నేల" : "Dominant soil"}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">{zone.dominant_soil}</dd>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                {te ? "వార్షిక నీరు అందుబాటులో" : "Annual water available"}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">
                {zone.overall_water_mm !== null ? `${zone.overall_water_mm} mm` : "—"}
              </dd>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                {te ? "సగటు వర్షపాతం (2011-2025)" : "Avg rainfall (2011-2025)"}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">
                {zone.avg_rainfall_mm !== null ? `${zone.avg_rainfall_mm} mm` : "—"}
              </dd>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                {te ? "భూగర్భజల స్థాయి" : "Groundwater stage"}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">
                {zone.groundwater_stage_pct !== null ? `${zone.groundwater_stage_pct}%` : "—"} ·{" "}
                {zone.groundwater_category}
              </dd>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                {te ? "ఖరీఫ్ / రబీ నీరు" : "Kharif / Rabi water"}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">
                {zone.kharif_water_mm !== null ? `${zone.kharif_water_mm} mm` : "—"} /{" "}
                {zone.rabi_water_mm !== null ? `${zone.rabi_water_mm} mm` : "—"}
              </dd>
            </div>
            <div className="rounded-xl bg-ivory p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                {te ? "సిఫార్సు చేయబడిన నీటిపారుదల" : "Recommended irrigation"}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">
                {zone.recommended_irrigation}
              </dd>
            </div>
          </dl>
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-charcoal/75">
            <p>
              <span className="font-semibold text-charcoal">{te ? "ఖరీఫ్ పంటలు: " : "Kharif crops: "}</span>
              {zone.suggested_kharif_crops}
            </p>
            <p>
              <span className="font-semibold text-charcoal">{te ? "రబీ పంటలు: " : "Rabi crops: "}</span>
              {zone.suggested_rabi_crops}
            </p>
            <p>
              <span className="font-semibold text-charcoal">{te ? "తక్కువ నీటి ఎంపికలు: " : "Low-water options: "}</span>
              {zone.suggested_low_water_crops}
            </p>
          </div>
          <p className="mt-5 text-xs text-charcoal/55">{zone.source_note}</p>
        </article>
      )}

      {/* Satellite modelled check: separate from the zone survey above.
          SoilGrids covers only pH, OC, N (g/kg), clay, sand, CEC — P, K,
          EC and micronutrients are listed as not measured, never invented. */}
      <SatelliteCheck />
    </div>
  );
}
