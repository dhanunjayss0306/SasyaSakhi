"use client";

import { useEffect, useState } from "react";
import type { CropId } from "@/types/crop";
import { CROPS, MOCK_NOTICE, SAMPLE_SOIL_REPORT } from "@/lib/mock-data";
import { getFertilizerPlan } from "@/lib/mock-recommendation-service";
import {
  BACKEND_CONFIGURED,
  fertilizerRecommendation,
  type ConfirmedValue,
} from "@/lib/api-client";
import { store, useStoredLang } from "@/lib/store";
import {
  FertilizerPanel,
  type LiveFertilizerPlan,
} from "@/components/recommendations/fertilizer-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Fertilizer Planner, split out of Crop Recommendations: fertilizer doses
 * live here and only here. The recommendations page shows crops only.
 * Live plan mirrors the old recommendations-page fetch (rules engine via
 * the backend); without a backend the illustrative mock plan renders.
 */

/** Frontend parameter keys -> backend canonical names (N, P, K — never oxides). */
const FRONTEND_TO_BACKEND = {
  ph: "pH",
  ec: "EC",
  oc: "OC",
  n: "N",
  p: "P",
  k: "K",
} as const;

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

export default function FertilizerPlannerPage() {
  const lang = useStoredLang();
  const te = lang === "te";
  const [selectedId, setSelectedId] = useState<CropId>("paddy");
  const selectedCrop = CROPS.find((c) => c.id === selectedId) ?? CROPS[0];
  const fertilizerItems = getFertilizerPlan(selectedId);
  const [fertResult, setFertResult] = useState<
    { status: "live" | "mock"; plan: LiveFertilizerPlan | null } | undefined
  >(undefined);

  // Live plan for the selected crop. Any failure falls back to the mock
  // rendering — never an error page.
  useEffect(() => {
    if (!BACKEND_CONFIGURED) return;
    let alive = true;
    (async () => {
      try {
        const res = await fertilizerRecommendation(selectedId, {
          values: reportValues(),
          area: 1,
          area_unit: "acre",
        });
        if (!res.success || res.items.length === 0) throw new Error("no items");
        if (alive) {
          setFertResult({
            status: "live",
            plan: {
              items: res.items.map((i) => ({
                product: i.product,
                nutrient: i.nutrient,
                quantity: i.quantity,
                unit: i.unit,
              })),
              ruleId: res.rule_id,
              explanation: res.explanation,
              area: res.area,
              areaUnit: res.area_unit,
              totalCost: res.total_cost,
              currency: res.currency,
            },
          });
        }
      } catch {
        if (alive) setFertResult({ status: "mock", plan: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">{te ? "ఎరువుల ప్రణాళిక" : "Fertilizer Planner"}</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
            {te
              ? "నియమాల ఇంజిన్ నుండి ఎంచుకున్న పంటకు ఎకరాకు మోతాదులు."
              : "Doses per acre for the selected crop, from the rules engine."}
          </p>
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
          {BACKEND_CONFIGURED ? (te ? "ప్రత్యక్షం" : "Live") : te ? "డెమో డేటా — ఇది ఒక నమూనా" : MOCK_NOTICE.split(".")[0]}
        </span>
      </div>

      {/* Crop selector tabs */}
      <div role="tablist" aria-label={te ? "పంటను ఎంచుకోండి" : "Select a crop"} className="mt-6 flex flex-wrap gap-2">
        {CROPS.map((crop) => (
          <Button
            key={crop.id}
            role="tab"
            aria-selected={selectedId === crop.id}
            variant={selectedId === crop.id ? "default" : "outline"}
            onClick={() => setSelectedId(crop.id)}
            className={cn(selectedId === crop.id && "bg-forest")}
          >
            {te ? crop.nameTe : crop.name} · {te ? crop.name : crop.nameTe}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {BACKEND_CONFIGURED && fertResult === undefined ? (
          <p className="text-sm text-charcoal/60" role="status">
            {te ? "ఎరువుల ప్రణాళిక లోడ్ అవుతోంది…" : "Loading fertilizer plan…"}
          </p>
        ) : (
          <FertilizerPanel
            cropName={te ? selectedCrop.nameTe : selectedCrop.name}
            items={fertilizerItems}
            live={fertResult?.status === "live" ? fertResult.plan : null}
          />
        )}
      </div>
    </div>
  );
}
