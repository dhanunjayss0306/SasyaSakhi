export type CropId = "paddy" | "cotton" | "chilli";

export interface Crop {
  id: CropId;
  name: string;
  nameTe: string;
  suitability: number;
  description: string;
  descriptionTe: string;
  season: string;
  waterNeed: "Low" | "Medium" | "High";
  soilFactors: string[];
  soilFactorsTe?: string[];
}
