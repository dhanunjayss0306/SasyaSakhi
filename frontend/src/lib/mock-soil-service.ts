import type { SoilReport } from "@/types/soil";
import { SAMPLE_SOIL_REPORT } from "./mock-data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simulate OCR extraction of a soil report. Frontend-only mock. */
export async function processSampleReport(): Promise<SoilReport> {
  await delay(1800);
  return structuredClone(SAMPLE_SOIL_REPORT);
}

/** Simulate OCR on a user-uploaded file. Returns the sample report, relabelled. */
export async function extractFromFile(fileName: string): Promise<SoilReport> {
  await delay(2200);
  const report = structuredClone(SAMPLE_SOIL_REPORT);
  report.fileName = fileName;
  report.id = `report-${Date.now()}`;
  report.uploadedAt = new Date().toISOString();
  return report;
}

/** Validate user-confirmed values before analysis. */
export function confirmValues(report: SoilReport): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const p of report.parameters) {
    if (p.value === null || Number.isNaN(p.value)) errors.push(`${p.label} needs a value.`);
    if (p.key === "ph" && p.value !== null && (p.value < 0 || p.value > 14))
      errors.push("pH must be between 0 and 14.");
  }
  return { ok: errors.length === 0, errors };
}
