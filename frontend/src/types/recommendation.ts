import type { CropId } from "./crop";

export interface FertilizerRec {
  product: string;
  nutrient: string;
  nutrientQty: string;
  productQty: string;
  unit: string;
  costPerAcre: number;
  note: string;
  illustrative: true;
}

export interface CropRecommendation {
  cropId: CropId;
  suitability: number;
  why: string[];
  fertilizers: FertilizerRec[];
}
