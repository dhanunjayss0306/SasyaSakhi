import type { CropRecommendation, FertilizerRec } from "@/types/recommendation";
import type { CropId } from "@/types/crop";
import { CROPS } from "./mock-data";

/**
 * BACKEND-WIRING NOTE — these functions deliberately stay mock (see README
 * "Backend wiring"). The backend crop/fertilizer endpoints are verified
 * working, but wiring them here would break honesty or the pages:
 *  (1) the recommendations page calls these functions synchronously, while
 *      backend calls are async;
 *  (2) the backend returns status labels (suitable/marginal/unsuitable) but
 *      the page renders a numeric suitability score — mapping labels to
 *      numbers would invent scores;
 *  (3) FertilizerRec forces `illustrative: true` and a per-acre cost, while
 *      the backend returns calculated (non-illustrative) doses with no prices
 *      (total_cost null).
 * Wiring needs the page to go async + label-based UI (Best/Good/Fair, like
 * the preview app already uses).
 */

/**
 * Deterministic, rule-style mock recommendation engine.
 * In the real product this runs server-side; the AI only explains results.
 * All numbers here are illustrative.
 */

const FERTILIZERS: Record<CropId, FertilizerRec[]> = {
  paddy: [
    { product: "Urea", nutrient: "Nitrogen", nutrientQty: "23 kg N", productQty: "50 kg", unit: "per acre", costPerAcre: 300, note: "Top-dress at tillering (illustrative)", noteTe: "టిల్లరింగ్ దశలో టాప్-డ్రెస్ (ఉదాహరణ)", illustrative: true },
    { product: "DAP", nutrient: "Phosphorus", nutrientQty: "11.5 kg P₂O₅", productQty: "25 kg", unit: "per acre", costPerAcre: 340, note: "Basal at sowing (illustrative)", noteTe: "విత్తేటప్పుడు బేసల్ (ఉదాహరణ)", illustrative: true },
  ],
  cotton: [
    { product: "DAP", nutrient: "Phosphorus", nutrientQty: "18 kg P₂O₅", productQty: "40 kg", unit: "per acre", costPerAcre: 545, note: "Basal — corrects low P (illustrative)", noteTe: "బేసల్ — తక్కువ P ని సరిచేస్తుంది (ఉదాహరణ)", illustrative: true },
    { product: "Urea", nutrient: "Nitrogen", nutrientQty: "18 kg N", productQty: "40 kg", unit: "per acre", costPerAcre: 240, note: "Split into two doses (illustrative)", noteTe: "రెండు మోతాదులుగా విభజించండి (ఉదాహరణ)", illustrative: true },
  ],
  chilli: [
    { product: "DAP", nutrient: "Phosphorus", nutrientQty: "14 kg P₂O₅", productQty: "30 kg", unit: "per acre", costPerAcre: 410, note: "Basal at transplanting (illustrative)", noteTe: "నాటేటప్పుడు బేసల్ (ఉదాహరణ)", illustrative: true },
    { product: "MOP", nutrient: "Potassium", nutrientQty: "18 kg K₂O", productQty: "30 kg", unit: "per acre", costPerAcre: 510, note: "Soil K is already high — keep light (illustrative)", noteTe: "నేల K ఇప్పటికే ఎక్కువ — తేలికగా ఉంచండి (ఉదాహరణ)", illustrative: true },
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
