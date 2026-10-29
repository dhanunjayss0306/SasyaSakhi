"use client";

import { useState } from "react";
import Link from "next/link";
import { CROPS } from "@/lib/mock-data";
import {
  BACKEND_CONFIGURED,
  fertilizerGeneral,
  getFertilizerSchedule,
  zoneLookup,
  type FertilizerResponse,
  type FertilizerScheduleResponse,
  type ZoneInfo,
} from "@/lib/api-client";
import { useStoredLang } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CalendarDays, Droplets, FlaskConical, Sprout } from "lucide-react";

/** "I Already Have a Crop": care guidance with NO soil report upload.
 *  Everything here comes from the crop book (season, water need), the zone
 *  survey (district zone + water), the published general fertilizer
 *  reference, and the dataset's N-split schedule. Soil values are never
 *  invented: where a soil test would change the answer, the page says so
 *  and points at uploading a lab report. */

type CropId = "paddy" | "cotton" | "chilli";

const CROP_NEEDLES: Record<CropId, string[]> = {
  paddy: ["paddy", "rice"],
  cotton: ["cotton"],
  chilli: ["chilli", "chili"],
};

/** Which of the zone's suggestion lists mention this crop. */
function zoneSeasonsFor(zone: ZoneInfo, crop: CropId): string[] {
  const needles = CROP_NEEDLES[crop];
  const lists: [string, string][] = [
    ["Kharif", zone.suggested_kharif_crops],
    ["Rabi", zone.suggested_rabi_crops],
    ["Low-water", zone.suggested_low_water_crops],
  ];
  return lists
    .filter(([, list]) => {
      const low = list.toLowerCase();
      return needles.some((n) => low.includes(n));
    })
    .map(([season]) => season);
}

export default function MyCropPage() {
  const lang = useStoredLang();
  const [crop, setCrop] = useState<CropId>("paddy");
  const [district, setDistrict] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zone, setZone] = useState<ZoneInfo | null>(null);
  const [zoneMessage, setZoneMessage] = useState<string | null>(null);
  const [fert, setFert] = useState<FertilizerResponse | null>(null);
  const [schedule, setSchedule] = useState<FertilizerScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cropBook = CROPS.find((c) => c.id === crop) ?? CROPS[0];
  const seasons = zone ? zoneSeasonsFor(zone, crop) : [];

  async function showCare() {
    setSubmitted(true);
    setLoading(true);
    setError(null);
    setZone(null);
    setZoneMessage(null);
    setFert(null);
    setSchedule(null);
    try {
      const trimmed = district.trim();
      if (trimmed) {
        try {
          const res = await zoneLookup(trimmed);
          if (res.found && res.zone) {
            setZone(res.zone);
          } else {
            setZoneMessage(res.message ?? "No zone found for this district.");
          }
        } catch {
          setZoneMessage("Zone lookup is unavailable — is the backend running?");
        }
      }
      if (BACKEND_CONFIGURED) {
        const plan = await fertilizerGeneral(crop, 1, "acre");
        if (!plan.success) throw new Error(plan.explanation || "No fertilizer plan available.");
        setFert(plan);
        if (plan.n_kg_ha) {
          try {
            const sched = await getFertilizerSchedule(crop, plan.n_kg_ha);
            if (sched.available) setSchedule(sched);
          } catch {
            // Schedule stays hidden; the fertilizer plan is unaffected.
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load crop care. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        {lang === "te" ? "నా పంట సంరక్షణ" : "I already have a crop"}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
        {lang === "te"
          ? "మట్టి నివేదిక లేకుండా మీ పంటకు సూచనలు — జోన్ మరియు పంట పుస్తకం నుండి మాత్రమే."
          : "Care for the crop already in your field — no soil report needed."}
      </p>

      {/* No-soil-report banner: the honesty label for this whole page. */}
      <div className="mt-5 rounded-2xl border border-gold/50 bg-gold/10 p-5">
        <p className="text-sm font-semibold text-charcoal">
          No soil report — zone + crop book guidance only
        </p>
        <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
          Nothing here is adjusted to your soil, because no soil values were
          given. For doses adjusted to your field, upload a lab report —{" "}
          <Link href="/soil-report" className="font-semibold text-forest hover:underline">
            Analyze My Soil
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-charcoal/70">
          మట్టి నివేదిక లేదు — ఈ సూచనలు జోన్ మరియు పంట పుస్తకం నుండి మాత్రమే.
        </p>
      </div>

      {/* Picker: crop + optional district */}
      <div className="mt-6 rounded-2xl border border-sage bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold text-charcoal">Which crop is in your field?</p>
        <div role="radiogroup" aria-label="Current crop" className="mt-3 flex flex-wrap gap-2">
          {CROPS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={crop === c.id}
              onClick={() => setCrop(c.id as CropId)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                crop === c.id
                  ? "border-forest bg-forest text-ivory"
                  : "border-forest/30 text-forest hover:bg-sage/50"
              }`}
            >
              {c.name} · {c.nameTe}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-semibold text-charcoal" htmlFor="my-crop-district">
          District <span className="font-normal text-charcoal/55">(optional — for zone guidance)</span>
        </label>
        <input
          id="my-crop-district"
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="District, e.g. Visakhapatnam"
          className="mt-2 w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <Button className="mt-4" onClick={() => void showCare()} disabled={loading}>
          {loading ? "Loading…" : "Show my crop care"}
        </Button>
        {!BACKEND_CONFIGURED && (
          <p className="mt-3 text-xs text-charcoal/55">
            Demo mode: the backend is not connected, so the fertilizer plan and
            schedule need NEXT_PUBLIC_API_URL set and the backend running. The
            crop book and zone notes below still work from the app itself.
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {submitted && !loading && (
        <div className="mt-6 space-y-6">
          {/* Crop book */}
          <section aria-labelledby="crop-book-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
            <h2 id="crop-book-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
              <Sprout className="size-5 text-forest" aria-hidden />
              {cropBook.name} · {cropBook.nameTe}
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-ivory p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Season (crop book)</dt>
                <dd className="mt-1 text-sm font-medium text-charcoal">{cropBook.season}</dd>
              </div>
              <div className="rounded-xl bg-ivory p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Water need (crop book)</dt>
                <dd className="mt-1 text-sm font-medium text-charcoal">{cropBook.waterNeed}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-charcoal/55">
              Crop book information only — not a verdict on your field. Your soil
              test decides the final dose.
            </p>
          </section>

          {/* Zone vs crop */}
          {district.trim() !== "" && (
            <section aria-labelledby="zone-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
              <h2 id="zone-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
                <Droplets className="size-5 text-forest" aria-hidden />
                Your zone vs this crop
              </h2>
              {zone ? (
                <>
                  <p className="mt-3 text-sm text-charcoal/75">
                    {zone.zone_name} · {zone.state}
                  </p>
                  {seasons.length > 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                      Your zone suggests {cropBook.name} for:{" "}
                      <span className="font-semibold text-forest">{seasons.join(", ")}</span>.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                      Your zone does not list {cropBook.name} among its suggested
                      crops. It can still grow with the right water and care —
                      ask Sakhi about your conditions before deciding.
                    </p>
                  )}
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-ivory p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                        Recommended irrigation
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-charcoal">{zone.recommended_irrigation}</dd>
                    </div>
                    <div className="rounded-xl bg-ivory p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                        Annual water available
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-charcoal">
                        {zone.overall_water_mm !== null ? `${zone.overall_water_mm} mm` : "—"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-charcoal/55">{zone.source_note}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-charcoal/75">{zoneMessage}</p>
              )}
            </section>
          )}

          {/* Fertilizer plan (general reference) */}
          <section aria-labelledby="fert-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
            <h2 id="fert-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
              <FlaskConical className="size-5 text-forest" aria-hidden />
              Fertilizer plan — general reference
            </h2>
            {fert ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{fert.explanation}</p>
                <ul className="mt-4 space-y-2">
                  {fert.items.map((item) => (
                    <li key={item.product} className="flex items-baseline justify-between gap-3 rounded-xl bg-ivory px-4 py-3 text-sm">
                      <span className="font-medium text-charcoal">
                        {item.product} <span className="text-charcoal/55">({item.nutrient})</span>
                      </span>
                      <span className="font-semibold text-charcoal">
                        {item.quantity} {item.unit} per {fert.area} {fert.area_unit}
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 space-y-1">
                  {fert.limitations.map((lim) => (
                    <li key={lim} className="text-xs leading-relaxed text-charcoal/55">· {lim}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-charcoal/70">
                {BACKEND_CONFIGURED
                  ? "No fertilizer plan could be loaded for this crop."
                  : "Connect the backend to see the general-reference fertilizer plan for this crop."}
              </p>
            )}
          </section>

          {/* Stage schedule */}
          {schedule && (
            <section aria-labelledby="schedule-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
              <h2 id="schedule-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
                <CalendarDays className="size-5 text-forest" aria-hidden />
                When to apply nitrogen — stage plan
              </h2>
              <p className="mt-3 text-sm text-charcoal/75">
                {schedule.crop} · N dose {schedule.n_dose_kg_ha} kg/ha (general reference)
                {schedule.duration_days_min != null && schedule.duration_days_max != null
                  ? ` · crop duration ${schedule.duration_days_min}–${schedule.duration_days_max} days (dataset window)`
                  : ""}
              </p>
              <ul className="mt-4 space-y-2">
                {schedule.splits.map((split) => (
                  <li key={split.stage} className="flex items-baseline justify-between gap-3 rounded-xl bg-ivory px-4 py-3 text-sm">
                    <span className="font-medium text-charcoal">{split.stage}</span>
                    <span className="text-charcoal/75">
                      {split.n_pct !== null ? `${split.n_pct}% of N` : ""}
                      {split.urea_kg_ha !== null ? ` · ${split.urea_kg_ha} kg/ha urea` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-charcoal/55">{schedule.prototype_label}</p>
              {schedule.rain_advisory && (
                <p className="mt-2 text-xs leading-relaxed text-charcoal/55">
                  Rain advisory: {schedule.rain_advisory.text}
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
