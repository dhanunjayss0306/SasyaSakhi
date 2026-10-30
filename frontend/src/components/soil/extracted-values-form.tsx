"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SoilReport, SoilParameter } from "@/types/soil";
import { confirmValues } from "@/lib/mock-soil-service";
import { MOCK_NOTICE } from "@/lib/mock-data";
import { useStoredLang } from "@/lib/store";

interface ExtractedValuesFormProps {
  report: SoilReport;
  onConfirm: (r: SoilReport) => void;
  onBack: () => void;
}

function toInput(value: number | null): string {
  return value === null ? "" : String(value);
}

function toValue(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

export function ExtractedValuesForm({ report, onConfirm, onBack }: ExtractedValuesFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(report.parameters.map((p) => [p.key, toInput(p.value)]))
  );
  const [errors, setErrors] = useState<string[]>([]);
  const lang = useStoredLang();
  const te = lang === "te";
  // The report's notice tells us whether these values came from the demo
  // fallback (MOCK_NOTICE) or a real backend extraction.
  const isDemo = report.mockNotice === MOCK_NOTICE;

  function update(key: string, input: string) {
    setValues((v) => ({ ...v, [key]: input }));
    setErrors([]);
  }

  function handleConfirm() {
    const updated: SoilReport = {
      ...report,
      parameters: report.parameters.map((p) => ({
        ...p,
        value: toValue(values[p.key] ?? ""),
      })),
    };
    const result = confirmValues(updated, lang);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onConfirm(updated);
  }

  return (
    <div>
      {isDemo && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-charcoal">
          {te ? "డెమో డేటా — స్వేచ్ఛగా సవరించండి" : "Demo data — edit freely"}
        </p>
      )}

      <div className="space-y-4">
        {report.parameters.map((p: SoilParameter) => (
          <div
            key={p.key}
            className="rounded-xl border border-forest/15 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`param-${p.key}`}
                className="text-sm font-medium text-charcoal"
              >
                {te ? p.labelTe : p.label}{" "}
                <span className="font-normal text-charcoal/60">· {te ? p.label : p.labelTe}</span>
                {p.unit && (
                  <span className="ml-1 text-xs text-charcoal/50">({p.unit})</span>
                )}
              </label>
              {p.uncertain && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  {te ? "తనిఖీ చేయండి" : "verify"}
                </span>
              )}
            </div>
            <input
              id={`param-${p.key}`}
              type="number"
              inputMode="decimal"
              step="any"
              value={values[p.key] ?? ""}
              onChange={(e) => update(p.key, e.target.value)}
              aria-describedby={p.uncertain ? `verify-${p.key}` : undefined}
              className="mt-2 w-full rounded-lg border border-charcoal/20 bg-ivory px-3 py-2 text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
            {p.uncertain && (
              <p id={`verify-${p.key}`} className="mt-1 text-xs text-amber-700">
                {isDemo
                  ? te
                    ? "డెమో OCR ఈ విలువ గురించి ఖచ్చితంగా లేదు — దయచేసి మీ నివేదికతో తనిఖీ చేయండి."
                    : "The demo OCR was unsure about this value — please check it against your report."
                  : te
                    ? "ఈ విలువను మీ నివేదికతో తనిఖీ చేయాలి."
                    : "This value needs checking against your report."}
              </p>
            )}
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          aria-label={te ? "ధృవీకరణ లోపాలు" : "Validation errors"}
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={handleConfirm}
          className="flex-1 bg-forest text-ivory hover:bg-pine"
        >
          {te ? "విలువలను నిర్ధారించండి" : "Confirm Values"}
        </Button>
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {te ? "వెనుకకు" : "Back"}
        </Button>
      </div>
    </div>
  );
}
