/**
 * SasyaSakhi backend API client (ADDITIVE — does not touch existing mocks/UI).
 *
 * Wiring (2 steps, nothing else to change):
 *  1. Set the backend URL: create `frontend/.env.local` with
 *       NEXT_PUBLIC_API_URL=http://localhost:8000
 *     (or your deployed backend URL). Defaults to http://localhost:8000.
 *  2. Import from here wherever Team 2 wants real data, e.g.
 *       import { extractReport, confirmReport } from "@/lib/api-client";
 *     and call these instead of the mock-* service functions.
 *
 * The backend degrades honestly: without Team 1's workbook, fertiliser
 * endpoints return { status: "needs_review", dose_basis: "general_reference" };
 * without Tesseract, extractReport returns { success: false } with a
 * manual-entry message. Handle those states in UI.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

/**
 * True only when NEXT_PUBLIC_API_URL is explicitly set at build time.
 * Pages use this for honest live/mock labels; services gate network calls
 * on the same condition. When false, the app is pure mock — no network.
 */
export const BACKEND_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_URL);

/* ------------------------------------------------------------------ types */

export type Provenance = "extracted" | "manual" | "corrected" | "demo";

export interface SoilField {
  parameter: string;
  label?: string | null;
  value: number | null;
  unit?: string | null;
  form?: string | null;
  confidence?: number | null;
  needs_review: boolean;
  provenance: Provenance;
  original_text?: string | null;
}

export interface ExtractResponse {
  success: boolean;
  report_id: string;
  status: string;
  fields: SoilField[];
  missing_fields: string[];
  raw_text_available: boolean;
  message: string;
  warnings: string[];
}

export interface ConfirmedValue {
  parameter: string;
  value: number | null;
  unit?: string | null;
  form?: string | null;
  provenance?: Provenance;
}

export interface ConfirmResponse {
  success: boolean;
  report_id: string;
  status: string;
  confirmed_count: number;
  still_missing: string[];
  message: string;
}

export interface ParameterAssessment {
  parameter: string;
  value: number | null;
  unit?: string | null;
  category?: string | null;
  status: "ok" | "concern" | "insufficient_data";
  explanation: string;
  rule_id?: string | null;
  source?: string | null;
}

export interface CropSuitability {
  crop: string;
  status: "suitable" | "marginal" | "unsuitable" | "insufficient_data";
  parameters_in_range?: number | null;
  parameters_compared?: number | null;
  supporting_factors: string[];
  limiting_factors: string[];
  missing_information: string[];
  rule_ids: string[];
  explanation: string;
  limitations: string[];
}

export interface FertilizerItem {
  product: string;
  nutrient: string;
  quantity: number;
  unit: string;
  unit_price?: number | null;
  total_cost?: number | null;
  currency: string;
}

export interface FertilizerResponse {
  success: boolean;
  crop: string;
  status: "calculated" | "needs_review" | "insufficient_data" | "price_not_configured";
  dose_basis: "workbook_rule" | "general_reference";
  items: FertilizerItem[];
  total_cost?: number | null;
  currency: string;
  area: number;
  area_unit: string;
  rule_id?: string | null;
  inputs_used: string[];
  assumptions: string[];
  explanation: string;
  limitations: string[];
}

export interface ChatResponse {
  success: boolean;
  language: string;
  answer: string;
  source_ids: string[];
  mode: "ai" | "template";
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  ocr: { available: boolean; engine: string | null; note: string | null };
  dataset: {
    workbook_found: boolean;
    workbook_path: string | null;
    workbook_error: string | null;
    sheets: string[];
    datasets: Record<string, { available: boolean; reason?: string; sheet?: string; rows?: number }>;
  };
  limitations: string[];
}

export interface DemoSampleResponse {
  success: boolean;
  is_demo: true;
  demo_label: string;
  report_id: string;
  status: string;
  fields: SoilField[];
  message: string;
}

/* ----------------------------------------------------------------- helpers */

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}: ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

const valuesBody = (report_id?: string, values?: ConfirmedValue[]) =>
  values?.length ? { values } : { report_id };

/* --------------------------------------------------------------- endpoints */

export const getHealth = () => req<HealthResponse>("/api/health");

export async function extractReport(file: File): Promise<ExtractResponse> {
  const form = new FormData();
  form.append("file", file);
  return req<ExtractResponse>("/api/soil-reports/extract", { method: "POST", body: form });
}

export const confirmReport = (report_id: string, values: ConfirmedValue[], area_acre?: number) =>
  req<ConfirmResponse>(`/api/soil-reports/${report_id}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, area_acre }),
  });

export const getReport = (report_id: string) => req(`/api/soil-reports/${report_id}`);

export const analyzeSoil = (report_id?: string, values?: ConfirmedValue[]) =>
  req<{ success: boolean; assessments: ParameterAssessment[]; overall_notes: string[]; warnings: string[] }>(
    "/api/soil-analysis",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valuesBody(report_id, values)),
    },
  );

export const cropSuitability = (report_id?: string, values?: ConfirmedValue[]) =>
  req<{ success: boolean; results: CropSuitability[]; warnings: string[] }>("/api/recommendations/crops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(valuesBody(report_id, values)),
  });

export const fertilizerRecommendation = (
  crop: string,
  opts: {
    report_id?: string;
    values?: ConfirmedValue[];
    area?: number;
    area_unit?: "acre" | "ha";
    target_yield_q_per_ha?: number;
    prices?: Record<string, number>;
  } = {},
) =>
  req<FertilizerResponse>("/api/recommendations/fertilizer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crop, ...opts }),
  });

export const chatWithAssistant = (
  message: string,
  opts: { language?: "en" | "te"; report_id?: string; context?: Record<string, unknown> } = {},
) =>
  req<ChatResponse>("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language: opts.language ?? "en", ...opts }),
  });

export const getDemoSample = () => req<DemoSampleResponse>("/api/demo/sample-report");

export const getWeather = (lat: number, lon: number) =>
  req(`/api/weather?lat=${lat}&lon=${lon}`);

/* --------------------------------------- satellite + live weather + tracking */

export interface SatelliteProperty {
  parameter: string;
  value: number;
  unit: string;
  depth: string;
  provenance: "satellite_model";
  note?: string;
}

export interface SatelliteResponse {
  available: boolean;
  reason?: string;
  source?: string;
  resolution_m?: number;
  latitude?: number;
  longitude?: number;
  properties?: SatelliteProperty[];
  disclaimers: string[];
}

export const getSatelliteSoil = (lat: number, lon: number) =>
  req<SatelliteResponse>(`/api/soil/satellite?lat=${lat}&lon=${lon}`);

export const getLiveWeather = (lat: number, lon: number) =>
  req(`/api/weather/live?lat=${lat}&lon=${lon}`);

export interface FertilizerSplit {
  stage: string;
  n_pct: number | null;
  n_kg_ha: number | null;
  urea_kg_ha: number | null;
  note?: string;
}

export interface FertilizerScheduleResponse {
  available: boolean;
  prototype_label: string;
  crop: string;
  dataset_row: string;
  n_dose_kg_ha: number;
  splits: FertilizerSplit[];
  split_pct_total: number;
  duration_days_min?: number | null;
  duration_days_max?: number | null;
  limitations: string[];
  rain_advisory?: { level: string; text: string; note: string } | null;
}

export const getFertilizerSchedule = (
  crop: string,
  n_kg_ha: number,
  lat?: number,
  lon?: number,
) =>
  req<FertilizerScheduleResponse>(
    `/api/tracking/fertilizer-schedule?crop=${encodeURIComponent(crop)}&n_kg_ha=${n_kg_ha}` +
      (lat !== undefined && lon !== undefined ? `&lat=${lat}&lon=${lon}` : ""),
  );
