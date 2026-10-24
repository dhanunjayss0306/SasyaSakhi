"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { ReportUploader } from "@/components/soil/report-uploader";
import { extractFromFile, processSampleReport } from "@/lib/mock-soil-service";
import { store } from "@/lib/store";

const STEPS = ["Reading file…", "Running OCR…", "Extracting values…"];

type Phase = "idle" | "processing" | "error";

export default function SoilReportPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "processing") return;
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [phase]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setPhase("processing");
    setActiveStep(0);
    try {
      await action();
      router.push("/soil-report/review");
    } catch (e) {
      setError(
        e instanceof Error
          ? `Could not process the report: ${e.message}`
          : "Could not process the report. Please try again."
      );
      setPhase("error");
    }
  }

  function handleProcess(file: File) {
    void run(async () => {
      store.setReport(await extractFromFile(file));
    });
  }

  function handleSample() {
    void run(async () => {
      store.setReport(await processSampleReport());
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          Upload Soil Report
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Upload your lab soil report as a PDF or photo. Our demo OCR reads the
          key values so you can confirm them before analysis.
        </p>
      </header>

      {phase === "processing" ? (
        <div
          role="status"
          aria-label="Processing soil report"
          className="rounded-2xl border border-forest/20 bg-white px-6 py-10"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-forest" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold text-charcoal">
              Reading your report
            </h2>
          </div>
          <ol className="mx-auto mt-6 max-w-xs space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                {i < activeStep ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf" aria-hidden="true" />
                ) : (
                  <Loader2
                    className={`h-5 w-5 shrink-0 animate-spin ${
                      i === activeStep ? "text-forest" : "text-charcoal/30"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-sm ${
                    i <= activeStep ? "font-medium text-charcoal" : "text-charcoal/50"
                  }`}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={STEPS.length}
            aria-valuenow={activeStep + 1}
            aria-label="OCR progress"
            className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-sage"
          >
            <div
              className="h-full rounded-full bg-leaf transition-all duration-700"
              style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <ReportUploader onProcess={handleProcess} onSample={handleSample} />
      )}

      {phase === "error" && error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="mt-1 text-sm font-medium text-forest underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
