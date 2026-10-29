export type ParamStatus = "low" | "optimal" | "high" | "unknown";

export interface SoilParameter {
  key: "ph" | "ec" | "oc" | "n" | "p" | "k";
  label: string;
  labelTe: string;
  value: number | null;
  unit: string;
  status: ParamStatus;
  uncertain?: boolean;
}

export interface ExtraSoilValue {
  parameter: string;
  value: number | null;
  unit?: string | null;
  form?: string | null;
}

export interface SoilReport {
  id: string;
  fileName: string;
  uploadedAt: string;
  parameters: SoilParameter[];
  mockNotice: string;
  /** Extracted values with no UI slot yet (S, Zn, Fe, B, ...). They are
   *  kept, never shown as the six main parameters, and passed to the
   *  ML score and backend confirm so micronutrients are not lost. */
  extraValues?: ExtraSoilValue[];
}
