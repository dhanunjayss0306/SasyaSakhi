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

export interface SoilReport {
  id: string;
  fileName: string;
  uploadedAt: string;
  parameters: SoilParameter[];
  mockNotice: string;
}
