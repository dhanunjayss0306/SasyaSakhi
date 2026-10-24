import type { CropRecommendation, FertilizerRec } from "@/types/recommendation";
import type { CropId } from "@/types/crop";
import { CROPS } from "./mock-data";

/**
 * Deterministic, rule-style mock recommendation engine.
 * In the real product this runs server-side; the AI only explains results.
 * All numbers here are illustrative.
 */

const FERTILIZERS: Record<CropId, FertilizerRec[]> = {
  paddy: [
    { product: "Urea", nutrient: "Nitrogen", nutrientQty: "23 kg N", productQty: "50 kg", unit: "per acre", costPerAcre: 300, note: "Top-dress at tillering (illustrative)", illustrative: true },
    { product: "DAP", nutrient: "Phosphorus", nutrientQty: "11.5 kg P₂O₅", productQty: "25 kg", unit: "per acre", costPerAcre: 340, note: "Basal at sowing (illustrative)", illustrative: true },
  ],
  cotton: [
    { product: "DAP", nutrient: "Phosphorus", nutrientQty: "18 kg P₂O₅", productQty: "40 kg", unit: "per acre", costPerAcre: 545, note: "Basal — corrects low P (illustrative)", illustrative: true },
    { product: "Urea", nutrient: "Nitrogen", nutrientQty: "18 kg N", productQty: "40 kg", unit: "per acre", costPerAcre: 240, note: "Split into two doses (illustrative)", illustrative: true },
  ],
  chilli: [
    { product: "DAP", nutrient: "Phosphorus", nutrientQty: "14 kg P₂O₅", productQty: "30 kg", unit: "per acre", costPerAcre: 410, note: "Basal at transplanting (illustrative)", illustrative: true },
    { product: "MOP", nutrient: "Potassium", nutrientQty: "18 kg K₂O", productQty: "30 kg", unit: "per acre", costPerAcre: 510, note: "Soil K is already high — keep light (illustrative)", illustrative: true },
  ],
};

export function getCropRecommendations(): CropRecommendation[] {
  return CROPS.map((c) => ({
    cropId: c.id,
    suitability: c.suitability,
    why: c.soilFactors,
    fertilizers: FERTILIZERS[c.id],
  }));
}

export function getFertilizerPlan(cropId: CropId): FertilizerRec[] {
  return FERTILIZERS[cropId] ?? [];
}

export function getRecommendationFor(cropId: CropId): CropRecommendation | undefined {
  return getCropRecommendations().find((r) => r.cropId === cropId);
}
