"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Camera,
  FileText,
  FlaskConical,
  Loader2,
  Satellite,
} from "lucide-react";
import { ReportUploader } from "@/components/soil/report-uploader";
import { extractFromFile, processSampleReport } from "@/lib/mock-soil-service";
import { store } from "@/lib/store";

const STEPS = ["Reading file…", "Running OCR…", "Extracting values…"];

type Phase = "idle" | "processing" | "error";
type Method = "choose" | "upload";

export default function SoilReportPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // First screen: how does the farmer want to share soil details? The
  // uploader only appears after "Upload soil report" is picked, so the
  // satellite, physical-test, and soil-photo options are visible up front.
  const [method, setMethod] = useState<Method>("choose");
  // True once the user has left this screen mid-upload (browser Back or
  // the Back button below). The pending upload must not yank them forward
  // to the review page after they already went back.
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (phase !== "processing") return;
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [phase]);

  // Back/forward navigation restores this page with its old state, so a
  // finished upload used to leave the processing screen stuck on screen
  // forever. Reset to the upload page whenever the browser moves back or
  // forward, and mark any pending upload cancelled.
  useEffect(() => {
    const onPopState = () => {
      cancelledRef.current = true;
      setPhase("idle");
      setActiveStep(0);
      setError(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function backToUpload() {
    cancelledRef.current = true;
    setPhase("idle");
    setActiveStep(0);
    setError(null);
  }

  async function run(action: () => Promise<void>) {
    cancelledRef.current = false;
    setError(null);
    setPhase("processing");
    setActiveStep(0);
    try {
      await action();
      if (cancelledRef.current) return;
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
          {method === "choose" ? "Share Your Soil Details" : "Upload Soil Report"}
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {method === "choose"
            ? "Pick how you want to share soil details. Every option leads into the same review and analysis flow."
            : "Upload your lab soil report as a PDF or photo. Our demo OCR reads the key values so you can confirm them before analysis."}
        </p>
      </header>

      {method === "choose" && phase !== "processing" ? (
        <div className="space-y-3">
          <p className="text-sm text-charcoal/70">
            Pick how you want to share soil details. Every option leads into
            the same review and analysis flow.
          </p>
          <button
            type="button"
            onClick={() => setMethod("upload")}
            className="flex w-full items-start gap-3 rounded-2xl border border-forest/20 bg-white px-5 py-4 text-left hover:bg-sage/40"
          >
            <FileText className="mt-0.5 h-6 w-6 shrink-0 text-forest" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-charcoal">Upload soil report</span>
              <span className="mt-0.5 block text-sm text-charcoal/70">
                PDF or photo of your lab report. The app reads the values.
              </span>
            </span>
          </button>
          <Link
            href="/zone-water"
            className="flex w-full items-start gap-3 rounded-2xl border border-forest/20 bg-white px-5 py-4 text-left hover:bg-sage/40"
          >
            <Satellite className="mt-0.5 h-6 w-6 shrink-0 text-forest" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-charcoal">Satellite</span>
              <span className="mt-0.5 block text-sm text-charcoal/70">
                Soil estimates by field location from satellite data. Only
                some values are available, and they are modelled estimates,
                never a lab test.
              </span>
            </span>
          </Link>
          <Link
            href="/soil-report/manual"
            className="flex w-full items-start gap-3 rounded-2xl border border-forest/20 bg-white px-5 py-4 text-left hover:bg-sage/40"
          >
            <FlaskConical className="mt-0.5 h-6 w-6 shrink-0 text-forest" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-charcoal">Physical test</span>
              <span className="mt-0.5 block text-sm text-charcoal/70">
                You already have a physical lab test. Type its values by hand.
              </span>
            </span>
          </Link>
          <Link
            href="/soil-report/photo"
            className="flex w-full items-start gap-3 rounded-2xl border border-forest/20 bg-white px-5 py-4 text-left hover:bg-sage/40"
          >
            <Camera className="mt-0.5 h-6 w-6 shrink-0 text-forest" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-charcoal">Soil photo</span>
              <span className="mt-0.5 block text-sm text-charcoal/70">
                Take a photo of your soil and attach it. Only a rough
                organic-carbon hint carries over; the rest stays blank
                to fill from a lab test.
              </span>
            </span>
          </Link>
        </div>
      ) : phase === "processing" ? (
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
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={backToUpload}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-sage/60"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to upload
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setMethod("choose")}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-sage bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-sage/60"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to options
          </button>
          <ReportUploader onProcess={handleProcess} onSample={handleSample} />
        </>
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
