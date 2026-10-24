"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSearch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ExtractedValuesForm } from "@/components/soil/extracted-values-form";
import { confirmValues, confirmBackendReport } from "@/lib/mock-soil-service";
import { MOCK_NOTICE } from "@/lib/mock-data";
import { store, useStoredReport } from "@/lib/store";
import type { SoilReport } from "@/types/soil";

export default function ReviewSoilReportPage() {
  const router = useRouter();
  // Hydration-safe: the stored report exists only on the client; reading it
  // in a useState initializer rendered the form on the client while the
  // server rendered "No report yet".
  const report = useStoredReport();
  const [errors, setErrors] = useState<string[]>([]);

  if (report === null) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage">
          <FileSearch className="h-8 w-8 text-forest" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-charcoal">
          No report yet
        </h1>
        <p className="mt-2 max-w-sm text-sm text-charcoal/70">
          Upload a soil report first so we can read its values and check them
          with you.
        </p>
        <Link
          href="/soil-report"
          className={buttonVariants({ className: "mt-6 bg-forest text-ivory hover:bg-pine" })}
        >
          Upload a soil report
        </Link>
      </div>
    );
  }

  async function handleConfirm(updated: SoilReport) {
    const result = confirmValues(updated);
    if (!result.ok) {
      setErrors(result.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    // Best-effort backend confirmation; never blocks the demo on failure.
    await confirmBackendReport(updated);
    store.setReport(updated);
    router.push("/soil-analysis");
  }

  const isDemo = report.mockNotice === MOCK_NOTICE;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          Review Extracted Values
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {isDemo ? "The demo OCR read these values from" : "OCR read these values from"}{" "}
          <span className="font-medium text-charcoal">{report.fileName}</span>.
          Correct anything that looks wrong, then confirm.
        </p>
      </header>

      {errors.length > 0 && (
        <div
          role="alert"
          aria-label="Validation errors"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <ExtractedValuesForm
        report={report}
        onConfirm={handleConfirm}
        onBack={() => router.push("/soil-report")}
      />
    </div>
  );
}
