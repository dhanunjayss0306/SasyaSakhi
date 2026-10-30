"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ExtractedValuesForm } from "@/components/soil/extracted-values-form";
import { store, useStoredLang } from "@/lib/store";
import type { SoilReport } from "@/types/soil";

/**
 * Physical test path: the farmer already has a physical lab test and types
 * its values by hand. No OCR, no invented values — the form itself enforces
 * all six values (and pH 0–14) before anything continues. Confirming here
 * stores the report and goes straight to analysis, since the farmer has
 * already checked the numbers by typing them.
 */
function blankReport(te: boolean): SoilReport {
  return {
    id: "manual-physical-test",
    fileName: te
      ? "భౌతిక ల్యాబ్ పరీక్ష — చేతితో టైప్ చేసిన విలువలు"
      : "Physical lab test — values typed by hand",
    // Placeholder only: handleConfirm stamps the real time on confirm
    // (render-time new Date() breaks the production prerender).
    uploadedAt: "",
    parameters: [
      { key: "ph", label: "pH", labelTe: "పీహెచ్", value: null, unit: "", status: "unknown" },
      { key: "ec", label: "EC", labelTe: "ఈసీ", value: null, unit: "dS/m", status: "unknown" },
      { key: "oc", label: "Organic Carbon", labelTe: "సేంద్రీయ కార్బన్", value: null, unit: "%", status: "unknown" },
      { key: "n", label: "Nitrogen (N)", labelTe: "నత్రజని", value: null, unit: "kg/ha", status: "unknown" },
      { key: "p", label: "Phosphorus (P)", labelTe: "భాస్వరం", value: null, unit: "kg/ha", status: "unknown" },
      { key: "k", label: "Potassium (K)", labelTe: "పొటాషియం", value: null, unit: "kg/ha", status: "unknown" },
    ],
    mockNotice: te
      ? "భౌతిక ల్యాబ్ పరీక్ష నుండి చేతితో టైప్ చేసిన విలువలు."
      : "Values typed by hand from a physical lab test.",
  };
}

export default function ManualPhysicalTestPage() {
  const router = useRouter();
  const lang = useStoredLang();
  const te = lang === "te";
  const report = useMemo(() => blankReport(te), [te]);

  function handleConfirm(updated: SoilReport) {
    store.setReport({ ...updated, id: `manual-${Date.now()}`, uploadedAt: new Date().toISOString() });
    router.push("/soil-analysis");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          {te ? "భౌతిక పరీక్ష విలువలు" : "Physical Test Values"}
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {te
            ? "మీ భౌతిక ల్యాబ్ పరీక్ష నివేదిక నుండి విలువలను టైప్ చేయండి. విశ్లేషణకు ఆరు విలువలు అవసరం."
            : "Type the values from your physical lab test report. All six values are needed for analysis."}
        </p>
      </header>
      <ExtractedValuesForm
        report={report}
        onConfirm={handleConfirm}
        onBack={() => router.push("/soil-report")}
      />
    </div>
  );
}
