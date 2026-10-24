"use client";

import { useMemo, useState } from "react";
import type { CropId } from "@/types/crop";
import { CROPS, MOCK_NOTICE } from "@/lib/mock-data";
import { getCropRecommendations, getFertilizerPlan } from "@/lib/mock-recommendation-service";
import { CropCard } from "@/components/recommendations/crop-card";
import { FertilizerPanel } from "@/components/recommendations/fertilizer-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function RecommendationsPage() {
  const [selectedId, setSelectedId] = useState<CropId>("paddy");
  const recommendations = useMemo(() => getCropRecommendations(), []);
  const selectedCrop = CROPS.find((c) => c.id === selectedId) ?? CROPS[0];
  const selectedRec = recommendations.find((r) => r.cropId === selectedId);
  const fertilizerItems = getFertilizerPlan(selectedId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Crop recommendations</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal/65">
            Suitability scores from your soil report, with an illustrative fertilizer plan for the selected crop.
          </p>
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
          {MOCK_NOTICE.split(".")[0]}
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

      {/* Crop cards grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CROPS.map((crop) => (
          <CropCard
            key={crop.id}
            crop={crop}
            selected={selectedId === crop.id}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      {/* Why suitable + fertilizer plan for the selected crop */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="why-heading" className="rounded-2xl border border-sage bg-white p-5 sm:p-6">
          <h2 id="why-heading" className="font-display text-xl font-semibold text-charcoal">
            Why {selectedCrop.name} suits your soil
          </h2>
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
        </section>

        <FertilizerPanel cropName={selectedCrop.name} items={fertilizerItems} />
      </div>
    </div>
  );
}
