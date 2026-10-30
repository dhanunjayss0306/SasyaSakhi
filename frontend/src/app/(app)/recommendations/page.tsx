"use client";

import { useEffect, useMemo, useState } from "react";
import type { CropId } from "@/types/crop";
import { CROPS, MOCK_NOTICE, SAMPLE_SOIL_REPORT } from "@/lib/mock-data";
import { getCropRecommendations } from "@/lib/mock-recommendation-service";
import {
  BACKEND_CONFIGURED,
  cropSuitability,
  mlSuitability,
  type ConfirmedValue,
  type CropSuitability,
  type MLResult,
} from "@/lib/api-client";
import { store } from "@/lib/store";
import { CropCard } from "@/components/recommendations/crop-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

type LiveCrop = {
  status: CropSuitability["status"];
  supporting: string[];
  limiting: string[];
  missing: string[];
  explanation: string;
};

/** Backend status labels, displayed verbatim — never mapped to numbers. */
const STATUS_LABEL: Record<LiveCrop["status"], string> = {
  suitable: "Suitable",
  marginal: "Marginal",
  unsuitable: "Unsuitable",
  insufficient_data: "Insufficient data",
};

/** Frontend parameter keys -> backend canonical names (N, P, K — never oxides). */
const FRONTEND_TO_BACKEND = {
  ph: "pH",
  ec: "EC",
  oc: "OC",
  n: "N",
  p: "P",
  k: "K",
} as const;

function toCropId(name: string): CropId | null {
  const n = name.toLowerCase();
  if (n.includes("rice") || n.includes("paddy")) return "paddy";
  if (n.includes("cotton")) return "cotton";
  if (n.includes("chilli") || n.includes("chili")) return "chilli";
  return null;
}

/** Confirmed values for backend calls: stored report, else the sample report. */
function reportValues(): ConfirmedValue[] {
  const report = store.getReport() ?? SAMPLE_SOIL_REPORT;
  const values: ConfirmedValue[] = [];
  for (const p of report.parameters) {
    if (p.value === null) continue;
    values.push({
      parameter: FRONTEND_TO_BACKEND[p.key],
      value: p.value,
      unit: p.unit || undefined,
    });
  }
  // Micronutrients extracted by OCR (S, Zn, Fe, B, ...) ride along so the
  // ML score sees the full report, not just the six main parameters.
  for (const extra of report.extraValues ?? []) {
    if (extra.value === null) continue;
    values.push({
      parameter: extra.parameter,
      value: extra.value,
      unit: extra.unit || undefined,
      form: extra.form || undefined,
    });
  }
  return values;
}

export default function RecommendationsPage() {
  const [selectedId, setSelectedId] = useState<CropId>("paddy");
  const recommendations = useMemo(() => getCropRecommendations(), []);
  const selectedCrop = CROPS.find((c) => c.id === selectedId) ?? CROPS[0];
  const selectedRec = recommendations.find((r) => r.cropId === selectedId);

  // Live backend state. When the backend is unset, everything below stays
  // null and the page renders exactly as before (mock).
  const [cropsPhase, setCropsPhase] = useState<"loading" | "live" | "mock">(
    BACKEND_CONFIGURED ? "loading" : "mock",
  );
  const [liveCrops, setLiveCrops] = useState<Map<CropId, LiveCrop> | null>(null);
  const [mlResults, setMlResults] = useState<Map<CropId, MLResult> | null>(null);

  // Fetch crop suitability once. Any failure (no values, bad response,
  // network) falls back to the mock rendering — never an error page.
  useEffect(() => {
    if (!BACKEND_CONFIGURED) return;
    let alive = true;
    (async () => {
      try {
        const values = reportValues();
        if (values.length === 0) throw new Error("no report values");
        const res = await cropSuitability(undefined, values);
        if (!res.success || res.results.length === 0) throw new Error("no results");
        const map = new Map<CropId, LiveCrop>();
        for (const r of res.results) {
          const id = toCropId(r.crop);
          if (id && !map.has(id)) {
            map.set(id, {
              status: r.status,
              supporting: r.supporting_factors,
              limiting: r.limiting_factors,
              missing: r.missing_information,
              explanation: r.explanation,
            });
          }
        }
        if (map.size === 0) throw new Error("no recognized crops");
        if (alive) {
          setLiveCrops(map);
          setCropsPhase("live");
        }
        // ML score: same soil values, scored by the deficit model. Any
        // failure hides the ML block only — the rules results stay live.
        try {
          const ml = await mlSuitability(undefined, values);
          if (ml.success) {
            const mlMap = new Map<CropId, MLResult>();
            for (const r of ml.results) {
              const id = toCropId(r.crop);
              if (id) mlMap.set(id, r);
            }
            if (alive) setMlResults(mlMap);
          }
        } catch {
          // ML block stays hidden; rules results are unaffected.
        }
      } catch {
        if (alive) setCropsPhase("mock");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const liveSelected = cropsPhase === "live" ? (liveCrops?.get(selectedId) ?? null) : null;
  const mlSelected = cropsPhase === "live" ? (mlResults?.get(selectedId) ?? null) : null;
  const showLiveWhy = liveSelected !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Crop recommendations</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
            {cropsPhase === "live"
              ? "Suitability from your soil report."
              : "Suitability scores from your soil report."}
          </p>
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
          {cropsPhase === "live" ? "Live" : MOCK_NOTICE.split(".")[0]}
        </span>
      </div>

      {/* Crop selector tabs */}
      <div role="tablist" aria-label="Select a crop" className="mt-6 flex flex-wrap gap-2">
        {CROPS.map((crop) => (
          <Button
            key={crop.id}
            role="tab"
            aria-selected={selectedId === crop.id}
            variant={selectedId === crop.id ? "default" : "outline"}
            onClick={() => setSelectedId(crop.id)}
            className={cn(selectedId === crop.id && "bg-forest")}
          >
            {crop.name} · {crop.nameTe}
          </Button>
        ))}
      </div>

      {cropsPhase === "loading" ? (
        <p className="mt-6 text-sm text-charcoal/60" role="status">
          Loading recommendations…
        </p>
      ) : (
        <>
          {/* Crop cards grid */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CROPS.map((crop) => {
              const live = liveCrops?.get(crop.id);
              return (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  selected={selectedId === crop.id}
                  onSelect={setSelectedId}
                  statusLabel={live ? STATUS_LABEL[live.status] : undefined}
                />
              );
            })}
          </div>

          {/* Why suitable for the selected crop — fertilizer lives only in Fertilizer Planner */}
          <div className="mt-8">
            <section aria-labelledby="why-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
              <h2 id="why-heading" className="font-display text-xl font-semibold text-charcoal">
                {showLiveWhy && liveSelected.status === "unsuitable"
                  ? `Why ${selectedCrop.name} is not recommended`
                  : `Why ${selectedCrop.name} suits your soil`}
              </h2>
              {showLiveWhy ? (
                <>
                  <p className="mt-1 text-sm text-charcoal/60">
                    Suitability:{" "}
                    <span className="font-semibold text-forest">
                      {STATUS_LABEL[liveSelected.status]}
                    </span>
                  </p>
                  {liveSelected.supporting.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {liveSelected.supporting.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-charcoal/80">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {liveSelected.limiting.length > 0 && (
                    <>
                      <h3 className="mt-5 text-sm font-semibold text-charcoal">Limiting factors</h3>
                      <ul className="mt-2 space-y-3">
                        {liveSelected.limiting.map((point) => (
                          <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-charcoal/80">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {liveSelected.missing.length > 0 && (
                    <p className="mt-4 text-xs text-charcoal/55">
                      Missing information: {liveSelected.missing.join(", ")}.
                    </p>
                  )}
                  <p className="mt-4 text-sm text-charcoal/70">{liveSelected.explanation}</p>
                  {mlSelected && (
                    <div className="mt-6 rounded-xl border border-sage bg-ivory p-4">
                      <h3 className="text-sm font-semibold text-charcoal">
                        ML score — why the model agrees or disagrees
                      </h3>
                      {mlSelected.score !== null ? (
                        <>
                          <p className="mt-1 text-sm text-charcoal/70">
                            ML suitability:{" "}
                            <span className="font-semibold text-forest">
                              {mlSelected.score}/100 ({mlSelected.status})
                            </span>
                          </p>
                          <p className="mt-2 text-sm text-charcoal/70">{mlSelected.explanation}</p>
                          {mlSelected.gaps.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {mlSelected.gaps.map((gap) => (
                                <li key={gap} className="text-sm leading-relaxed text-charcoal/80">
                                  {gap}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-charcoal/70">{mlSelected.explanation}</p>
                      )}
                      <p className="mt-3 text-xs text-charcoal/55">
                        The ML score only compares gaps against the crop's ideal needs.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-charcoal/60">
                    Suitability score: <span className="font-semibold text-forest">{selectedRec?.suitability ?? selectedCrop.suitability}%</span>
                  </p>
                  <ul className="mt-4 space-y-3">
                    {(selectedRec?.why ?? selectedCrop.soilFactors).map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-charcoal/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-charcoal/55">
                    Demo data — scores are illustrative and based on the sample soil report.
                  </p>
                </>
              )}
            </section>

          </div>
        </>
      )}
    </div>
  );
}
