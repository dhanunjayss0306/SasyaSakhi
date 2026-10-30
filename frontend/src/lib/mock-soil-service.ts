import type { SoilReport, SoilParameter, ParamStatus } from "@/types/soil";
import { SAMPLE_SOIL_REPORT, MOCK_NOTICE } from "./mock-data";
import {
  extractReport,
  getDemoSample,
  analyzeSoil,
  confirmReport,
  type SoilField,
  type ConfirmedValue,
} from "./api-client";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Backend wiring (service layer only — pages and UI are untouched).
 *
 * The backend is attempted ONLY when NEXT_PUBLIC_API_URL is set in
 * frontend/.env.local (before `npm run dev` / `npm run build`). When it is
 * unset, every function below behaves exactly as before: pure mock data,
 * no network calls, no console noise.
 *
 * On ANY backend failure (down, timeout, bad response, OCR unavailable),
 * the function falls back to the previous mock behavior. Mock fallback data
 * keeps the MOCK_NOTICE demo label, exactly as before. Real backend data is
 * never relabelled as mock, and mock data is never presented as real.
 */

const API_ENABLED = Boolean(process.env.NEXT_PUBLIC_API_URL);

/* Backend parameter names -> frontend SoilParameter keys. The frontend only
 * models pH/EC/OC/N/P/K; extra backend parameters (S, Zn, Fe, ...) have no
 * slot in the UI yet and are dropped here (documented, not hidden: the
 * review form only edits these six). */
const BACKEND_TO_FRONTEND: Record<string, SoilParameter["key"]> = {
  pH: "ph",
  EC: "ec",
  OC: "oc",
  N: "n",
  P: "p",
  K: "k",
};

const META: Record<
  SoilParameter["key"],
  { label: string; labelTe: string; unit: string }
> = {
  ph: { label: "pH", labelTe: "పీహెచ్", unit: "" },
  ec: { label: "EC", labelTe: "ఈసీ", unit: "dS/m" },
  oc: { label: "Organic Carbon", labelTe: "సేంద్రీయ కార్బన్", unit: "%" },
  n: { label: "Nitrogen (N)", labelTe: "నత్రజని", unit: "kg/ha" },
  p: { label: "Phosphorus (P)", labelTe: "భాస్వరం", unit: "kg/ha" },
  k: { label: "Potassium (K)", labelTe: "పొటాషియం", unit: "kg/ha" },
};

const FRONTEND_KEYS = ["ph", "ec", "oc", "n", "p", "k"] as const;

/** Backend assessment categories -> frontend ParamStatus. */
function categoryToStatus(category: string | null | undefined): ParamStatus {
  if (!category) return "unknown";
  const c = category.toLowerCase();
  if (c === "insufficient_data") return "unknown";
  if (c === "very_low" || c === "low" || c === "acidic") return "low";
  if (c === "medium" || c === "neutral" || c === "normal") return "optimal";
  if (c === "high" || c === "very_high" || c === "alkaline" || c === "saline")
    return "high";
  return "unknown";
}

function mapFieldsToReport(
  fields: SoilField[],
  id: string,
  fileName: string,
  notice: string,
): SoilReport {
  const byKey = new Map<SoilParameter["key"], SoilParameter>();
  const extraValues: { parameter: string; value: number | null; unit?: string | null; form?: string | null }[] = [];
  for (const f of fields) {
    const key = BACKEND_TO_FRONTEND[f.parameter];
    if (!key) {
      // Micronutrients and other extras: preserved for ML + confirm,
      // never forced into one of the six main parameter slots.
      extraValues.push({ parameter: f.parameter, value: f.value, unit: f.unit, form: f.form });
      continue;
    }
    const meta = META[key];
    byKey.set(key, {
      key,
      label: f.label ?? meta.label,
      labelTe: meta.labelTe,
      value: f.value,
      unit: f.unit ?? meta.unit,
      status: "unknown",
      uncertain: f.needs_review,
    });
  }
  // Fixed six-parameter order; values the backend did not return stay null
  // (never zero-filled) and flagged for manual review.
  const parameters = FRONTEND_KEYS.map(
    (key): SoilParameter =>
      byKey.get(key) ?? {
        key,
        label: META[key].label,
        labelTe: META[key].labelTe,
        value: null,
        unit: META[key].unit,
        status: "unknown",
        uncertain: true,
      },
  );
  return {
    id,
    fileName,
    uploadedAt: new Date().toISOString(),
    parameters,
    mockNotice: notice,
    extraValues: extraValues.length > 0 ? extraValues : undefined,
  };
}

/**
 * Best-effort status enrichment: ask the backend to assess the extracted
 * values so the analysis page's verdict reflects real assessments instead of
 * "unknown" statuses. Never throws — on failure, statuses stay "unknown".
 */
async function enrichStatuses(
  reportId: string,
  parameters: SoilParameter[],
): Promise<void> {
  try {
    const res = await analyzeSoil(reportId);
    const byParam = new Map(res.assessments.map((a) => [a.parameter, a]));
    for (const p of parameters) {
      const backendKey = (Object.keys(BACKEND_TO_FRONTEND) as string[]).find(
        (k) => BACKEND_TO_FRONTEND[k] === p.key,
      );
      const assessment = backendKey ? byParam.get(backendKey) : undefined;
      if (assessment) p.status = categoryToStatus(assessment.category);
    }
  } catch {
    // Statuses stay "unknown"; the extracted values themselves are still real.
    console.debug(
      "SasyaSakhi: backend analysis unavailable, statuses stay unknown.",
    );
  }
}

function mockSample(fileName: string): SoilReport {
  const report = structuredClone(SAMPLE_SOIL_REPORT);
  report.fileName = fileName;
  report.id = `report-${Date.now()}`;
  report.uploadedAt = new Date().toISOString();
  return report;
}

/** Backend demo sample (explicitly labelled demo data) with mock fallback. */
export async function processSampleReport(): Promise<SoilReport> {
  if (API_ENABLED) {
    try {
      const demo = await getDemoSample();
      if (demo.success && demo.fields.length > 0) {
        const report = mapFieldsToReport(
          demo.fields,
          demo.report_id,
          "sample-soil-report.pdf",
          MOCK_NOTICE,
        );
        await enrichStatuses(demo.report_id, report.parameters);
        return report;
      }
    } catch {
      console.debug(
        "SasyaSakhi: backend demo sample unavailable, using mock sample.",
      );
    }
  }
  await delay(1800);
  return structuredClone(SAMPLE_SOIL_REPORT);
}

/**
 * Extract values from an uploaded report.
 *
 * Accepts a File (backend OCR path) or a plain filename string (today's mock
 * path). Pages currently pass only the filename, so in production use this
 * still returns the mock sample — exactly as before. The moment a page passes
 * the File object, the backend OCR path activates with mock fallback:
 *   ReportUploader: onProcess(file) instead of onProcess(file.name), and the
 *   soil-report page's handleProcess takes the File and calls extractFromFile(file).
 * (One-line change in each file; see README "Backend wiring".)
 */
export async function extractFromFile(file: File | string): Promise<SoilReport> {
  if (typeof file !== "string" && API_ENABLED) {
    try {
      const res = await extractReport(file);
      if (res.success && res.fields.length > 0) {
        const report = mapFieldsToReport(
          res.fields,
          res.report_id,
          file.name,
          "Values extracted from your uploaded report — please confirm them before analysis.",
        );
        await enrichStatuses(res.report_id, report.parameters);
        return report;
      }
      // Backend reachable but OCR unavailable/unreadable: fall through to the
      // demo flow below (same as today's behavior).
      console.debug(
        "SasyaSakhi: backend extraction unavailable, using mock sample.",
      );
    } catch {
      console.debug("SasyaSakhi: backend unreachable, using mock sample.");
    }
  }
  // Today's behavior, unchanged: simulated extraction returning the sample report.
  const fileName = typeof file === "string" ? file : file.name;
  await delay(2200);
  return mockSample(fileName);
}

/**
 * Validate user-confirmed values before analysis. Pure validation — no
 * backend call. After validation passes, the review page awaits
 * confirmBackendReport() (best-effort, never blocking) before routing.
 */
export function confirmValues(report: SoilReport, lang: "en" | "te" = "en"): {
  ok: boolean;
  errors: string[];
} {
  const te = lang === "te";
  const errors: string[] = [];
  for (const p of report.parameters) {
    if (p.value === null || Number.isNaN(p.value))
      errors.push(
        te ? `${p.labelTe} కు విలువ అవసరం.` : `${p.label} needs a value.`,
      );
    if (p.key === "ph" && p.value !== null && (p.value < 0 || p.value > 14))
      errors.push(te ? "pH 0 మరియు 14 మధ్య ఉండాలి." : "pH must be between 0 and 14.");
  }
  return { ok: errors.length === 0, errors };
}

const FRONTEND_TO_BACKEND: Record<SoilParameter["key"], string> = {
  ph: "pH",
  ec: "EC",
  oc: "OC",
  n: "N",
  p: "P",
  k: "K",
};

/**
 * Best-effort backend confirmation of user-corrected values. Never throws:
 * when the backend is unset, the report id is unknown to it (mock/sample
 * ids), or the network fails, it returns false and the caller keeps today's
 * local flow. Sends canonical nutrient names (N, P, K) only.
 */
export async function confirmBackendReport(report: SoilReport): Promise<boolean> {
  if (!API_ENABLED) return false;
  try {
    const values: ConfirmedValue[] = [];
    for (const p of report.parameters) {
      if (p.value === null) continue;
      values.push({
        parameter: FRONTEND_TO_BACKEND[p.key],
        value: p.value,
        unit: p.unit || undefined,
      });
    }
    // Micronutrients extracted by OCR travel with the confirm too, so the
    // backend's confirmed report (and the ML score) is not limited to six.
    for (const extra of report.extraValues ?? []) {
      if (extra.value === null) continue;
      values.push({
        parameter: extra.parameter,
        value: extra.value,
        unit: extra.unit || undefined,
        form: extra.form || undefined,
      });
    }
    const res = await confirmReport(report.id, values);
    return res.success;
  } catch {
    console.debug("SasyaSakhi: backend confirm unavailable, keeping local flow.");
    return false;
  }
}
