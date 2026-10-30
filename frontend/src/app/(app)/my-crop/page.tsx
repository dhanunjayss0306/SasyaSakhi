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

const SEASON_TE: Record<string, string> = {
  Kharif: "ఖరీఫ్",
  Rabi: "రబీ",
  "Low-water": "తక్కువ నీరు",
};

const WATER_TE: Record<string, string> = {
  High: "ఎక్కువ",
  Medium: "మధ్యస్థం",
  Low: "తక్కువ",
};

const NUTRIENT_TE: Record<string, string> = {
  Nitrogen: "నత్రజని",
  Phosphorus: "భాస్వరం",
  Potassium: "పొటాషియం",
};

export default function MyCropPage() {
  const lang = useStoredLang();
  const te = lang === "te";
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
            setZoneMessage(res.message ?? (te ? "ఈ జిల్లాకు జోన్ కనిపించలేదు." : "No zone found for this district."));
          }
        } catch {
          setZoneMessage(te ? "జోన్ వెతుకులాట అందుబాటులో లేదు — బ్యాకెండ్ నడుస్తోందా?" : "Zone lookup is unavailable — is the backend running?");
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
      setError(e instanceof Error ? e.message : te ? "పంట సంరక్షణ లోడ్ చేయలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి." : "Could not load crop care. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        {te ? "నా పంట సంరక్షణ" : "I already have a crop"}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
        {te
          ? "మట్టి నివేదిక లేకుండా మీ పంటకు సూచనలు — జోన్ మరియు పంట పుస్తకం నుండి మాత్రమే."
          : "Care for the crop already in your field — no soil report needed."}
      </p>

      {/* No-soil-report banner: the honesty label for this whole page. */}
      <div className="mt-5 rounded-2xl border border-gold/50 bg-gold/10 p-5">
        <p className="text-sm font-semibold text-charcoal">
          {te ? "నేల నివేదిక లేదు — జోన్ + పంట పుస్తక మార్గదర్శకత్వం మాత్రమే" : "No soil report — zone + crop book guidance only"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
          {te ? (
            <>
              ఇక్కడ ఏదీ మీ నేలకు సర్దుబాటు చేయబడలేదు, ఎందుకంటే నేల విలువలు ఇవ్వబడలేదు. మీ పొలానికి సర్దుబాటు చేసిన మోతాదుల కోసం, ల్యాబ్ నివేదికను అప్‌లోడ్ చేయండి —{" "}
              <Link href="/soil-report" className="font-semibold text-forest hover:underline">
                నా నేలను విశ్లేషించండి
              </Link>
              .
            </>
          ) : (
            <>
              Nothing here is adjusted to your soil, because no soil values were
              given. For doses adjusted to your field, upload a lab report —{" "}
              <Link href="/soil-report" className="font-semibold text-forest hover:underline">
                Analyze My Soil
              </Link>
              .
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-charcoal/70">
          మట్టి నివేదిక లేదు — ఈ సూచనలు జోన్ మరియు పంట పుస్తకం నుండి మాత్రమే.
        </p>
      </div>

      {/* Picker: crop + optional district */}
      <div className="mt-6 rounded-2xl border border-sage bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold text-charcoal">{te ? "మీ పొలంలో ఏ పంట ఉంది?" : "Which crop is in your field?"}</p>
        <div role="radiogroup" aria-label={te ? "ప్రస్తుత పంట" : "Current crop"} className="mt-3 flex flex-wrap gap-2">
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
              {te ? c.nameTe : c.name} · {te ? c.name : c.nameTe}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-semibold text-charcoal" htmlFor="my-crop-district">
          {te ? "జిల్లా" : "District"} <span className="font-normal text-charcoal/55">{te ? "(ఐచ్ఛికం — జోన్ మార్గదర్శకత్వం కోసం)" : "(optional — for zone guidance)"}</span>
        </label>
        <input
          id="my-crop-district"
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder={te ? "జిల్లా, ఉదా. విశాఖపట్నం" : "District, e.g. Visakhapatnam"}
          className="mt-2 w-full rounded-xl border border-sage bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-forest"
        />
        <Button className="mt-4" onClick={() => void showCare()} disabled={loading}>
          {loading ? (te ? "లోడ్ అవుతోంది…" : "Loading…") : te ? "నా పంట సంరక్షణ చూపండి" : "Show my crop care"}
        </Button>
        {!BACKEND_CONFIGURED && (
          <p className="mt-3 text-xs text-charcoal/55">
            {te
              ? "డెమో మోడ్: బ్యాకెండ్ కనెక్ట్ కాలేదు, కాబట్టి ఎరువుల ప్రణాళిక మరియు షెడ్యూల్ కోసం NEXT_PUBLIC_API_URL సెట్ చేసి బ్యాకెండ్ నడుస్తుండాలి. కింద పంట పుస్తకం మరియు జోన్ గమనికలు యాప్ నుండే పనిచేస్తాయి."
              : "Demo mode: the backend is not connected, so the fertilizer plan and schedule need NEXT_PUBLIC_API_URL set and the backend running. The crop book and zone notes below still work from the app itself."}
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
              {te ? cropBook.nameTe : cropBook.name} · {te ? cropBook.name : cropBook.nameTe}
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-ivory p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{te ? "సీజన్ (పంట పుస్తకం)" : "Season (crop book)"}</dt>
                <dd className="mt-1 text-sm font-medium text-charcoal">
                  {te
                    ? cropBook.season.replace("Kharif", "ఖరీఫ్").replace("Rabi", "రబీ").replace("Jun", "జూన్").replace("Nov", "నవం").replace("Apr", "ఏప్రి").replace("Oct", "అక్టో").replace("Jul", "జులై").replace("Feb", "ఫిబ్ర")
                    : cropBook.season}
                </dd>
              </div>
              <div className="rounded-xl bg-ivory p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{te ? "నీటి అవసరం (పంట పుస్తకం)" : "Water need (crop book)"}</dt>
                <dd className="mt-1 text-sm font-medium text-charcoal">{te ? (WATER_TE[cropBook.waterNeed] ?? cropBook.waterNeed) : cropBook.waterNeed}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-charcoal/55">
              {te
                ? "పంట పుస్తక సమాచారం మాత్రమే — మీ పొలంపై తీర్పు కాదు. మీ నేల పరీక్షే తుది మోతాదును నిర్ణయిస్తుంది."
                : "Crop book information only — not a verdict on your field. Your soil test decides the final dose."}
            </p>
          </section>

          {/* Zone vs crop */}
          {district.trim() !== "" && (
            <section aria-labelledby="zone-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
              <h2 id="zone-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
                <Droplets className="size-5 text-forest" aria-hidden />
                {te ? "మీ జోన్ vs ఈ పంట" : "Your zone vs this crop"}
              </h2>
              {zone ? (
                <>
                  <p className="mt-3 text-sm text-charcoal/75">
                    {zone.zone_name} · {zone.state}
                  </p>
                  {seasons.length > 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                      {te ? (
                        <>
                          మీ జోన్ {te ? cropBook.nameTe : cropBook.name} ను సూచిస్తుంది:{" "}
                          <span className="font-semibold text-forest">{seasons.map((s) => SEASON_TE[s] ?? s).join(", ")}</span>.
                        </>
                      ) : (
                        <>
                          Your zone suggests {cropBook.name} for:{" "}
                          <span className="font-semibold text-forest">{seasons.join(", ")}</span>.
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                      {te
                        ? `మీ జోన్ సూచించిన పంటలలో ${cropBook.nameTe} లేదు. సరైన నీరు మరియు సంరక్షణతో ఇది ఇంకా పెరుగుతుంది — నిర్ణయించే ముందు మీ పరిస్థితుల గురించి సఖిని అడగండి.`
                        : `Your zone does not list ${cropBook.name} among its suggested crops. It can still grow with the right water and care — ask Sakhi about your conditions before deciding.`}
                    </p>
                  )}
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-ivory p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                        {te ? "సిఫార్సు చేసిన నీటిపారుదల" : "Recommended irrigation"}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-charcoal">{zone.recommended_irrigation}</dd>
                    </div>
                    <div className="rounded-xl bg-ivory p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                        {te ? "వార్షిక నీరు అందుబాటులో" : "Annual water available"}
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
              {te ? "ఎరువుల ప్రణాళిక — సాధారణ సూచన" : "Fertilizer plan — general reference"}
            </h2>
            {fert ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{fert.explanation}</p>
                <ul className="mt-4 space-y-2">
                  {fert.items.map((item) => (
                    <li key={item.product} className="flex items-baseline justify-between gap-3 rounded-xl bg-ivory px-4 py-3 text-sm">
                      <span className="font-medium text-charcoal">
                        {item.product} <span className="text-charcoal/55">({te ? (NUTRIENT_TE[item.nutrient] ?? item.nutrient) : item.nutrient})</span>
                      </span>
                      <span className="font-semibold text-charcoal">
                        {item.quantity} {item.unit} {te ? `${fert.area} ఎకరాకు` : `per ${fert.area} ${fert.area_unit}`}
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
                  ? te
                    ? "ఈ పంటకు ఎరువుల ప్రణాళిక లోడ్ చేయలేకపోయాము."
                    : "No fertilizer plan could be loaded for this crop."
                  : te
                    ? "ఈ పంటకు సాధారణ-సూచన ఎరువుల ప్రణాళికను చూడటానికి బ్యాకెండ్‌ను కనెక్ట్ చేయండి."
                    : "Connect the backend to see the general-reference fertilizer plan for this crop."}
              </p>
            )}
          </section>

          {/* Stage schedule */}
          {schedule && (
            <section aria-labelledby="schedule-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
              <h2 id="schedule-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
                <CalendarDays className="size-5 text-forest" aria-hidden />
                {te ? "నత్రజనిని ఎప్పుడు వేయాలి — దశ ప్రణాళిక" : "When to apply nitrogen — stage plan"}
              </h2>
              <p className="mt-3 text-sm text-charcoal/75">
                {schedule.crop} · {te ? `N మోతాదు ${schedule.n_dose_kg_ha} kg/ha (సాధారణ సూచన)` : `N dose ${schedule.n_dose_kg_ha} kg/ha (general reference)`}
                {schedule.duration_days_min != null && schedule.duration_days_max != null
                  ? te
                    ? ` · పంట వ్యవధి ${schedule.duration_days_min}–${schedule.duration_days_max} రోజులు (డేటాసెట్ విండో)`
                    : ` · crop duration ${schedule.duration_days_min}–${schedule.duration_days_max} days (dataset window)`
                  : ""}
              </p>
              <ul className="mt-4 space-y-2">
                {schedule.splits.map((split) => (
                  <li key={split.stage} className="flex items-baseline justify-between gap-3 rounded-xl bg-ivory px-4 py-3 text-sm">
                    <span className="font-medium text-charcoal">{split.stage}</span>
                    <span className="text-charcoal/75">
                      {split.n_pct !== null ? `${split.n_pct}% ${te ? "N" : "of N"}` : ""}
                      {split.urea_kg_ha !== null ? ` · ${split.urea_kg_ha} kg/ha ${te ? "యూరియా" : "urea"}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-charcoal/55">{schedule.prototype_label}</p>
              {schedule.rain_advisory && (
                <p className="mt-2 text-xs leading-relaxed text-charcoal/55">
                  {te ? "వర్ష సూచన:" : "Rain advisory:"} {schedule.rain_advisory.text}
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
