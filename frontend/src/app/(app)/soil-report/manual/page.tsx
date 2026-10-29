"use client";

import { useRouter } from "next/navigation";
import { ExtractedValuesForm } from "@/components/soil/extracted-values-form";
import { store } from "@/lib/store";
import type { SoilReport } from "@/types/soil";

/**
 * Physical test path: the farmer already has a physical lab test and types
 * its values by hand. No OCR, no invented values — the form itself enforces
 * all six values (and pH 0–14) before anything continues. Confirming here
 * stores the report and goes straight to analysis, since the farmer has
 * already checked the numbers by typing them.
 */
const BLANK_REPORT: SoilReport = {
  id: "manual-physical-test",
  fileName: "Physical lab test — values typed by hand",
  uploadedAt: new Date().toISOString(),
  parameters: [
    { key: "ph", label: "pH", labelTe: "పీహెచ్", value: null, unit: "", status: "unknown" },
    { key: "ec", label: "EC", labelTe: "ఈసీ", value: null, unit: "dS/m", status: "unknown" },
    { key: "oc", label: "Organic Carbon", labelTe: "సేంద్రియ కార్బన్", value: null, unit: "%", status: "unknown" },
    { key: "n", label: "Nitrogen (N)", labelTe: "నత్రజని", value: null, unit: "kg/ha", status: "unknown" },
    { key: "p", label: "Phosphorus (P)", labelTe: "భాస్వరం", value: null, unit: "kg/ha", status: "unknown" },
    { key: "k", label: "Potassium (K)", labelTe: "పొటాషియం", value: null, unit: "kg/ha", status: "unknown" },
  ],
  mockNotice: "Values typed by hand from a physical lab test.",
};

export default function ManualPhysicalTestPage() {
  const router = useRouter();

  function handleConfirm(updated: SoilReport) {
    store.setReport({ ...updated, id: `manual-${Date.now()}`, uploadedAt: new Date().toISOString() });
    router.push("/soil-analysis");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          Physical Test Values
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Type the values from your physical lab test report. All six values
          are needed for analysis.
        </p>
      </header>
      <ExtractedValuesForm
        report={BLANK_REPORT}
        onConfirm={handleConfirm}
        onBack={() => router.push("/soil-report")}
      />
    </div>
  );
}
