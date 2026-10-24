"use client";

import { useRef, useState } from "react";
import { FileUp, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPTED_EXTS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_SIZE_MB = 10;

interface ReportUploaderProps {
  onProcess: (fileName: string) => void;
  onSample: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportUploader({ onProcess, onSample }: ReportUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(candidate: File): string | null {
    const ext = candidate.name.slice(candidate.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      return `Unsupported file type. Please upload one of: ${ACCEPTED_EXTS.join(", ")}`;
    }
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large (${formatSize(candidate.size)}). Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const candidate = files[0];
    const validationError = validate(candidate);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleProcess() {
    if (!file) return;
    setBusy(true);
    onProcess(file.name);
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        id="soil-report-file"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        aria-label="Choose a soil report file"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload soil report — drag a file here or press Enter to browse"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging
            ? "border-leaf bg-sage/60"
            : "border-forest/25 bg-ivory hover:border-forest/50 hover:bg-sage/40"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10">
          <FileUp className="h-7 w-7 text-forest" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-charcoal">
            Drag your soil report here
          </p>
          <p className="mt-1 text-sm text-charcoal/70">
            PDF, JPG or PNG — up to {MAX_SIZE_MB} MB
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse files
        </Button>
      </div>

      {/* File error */}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Selected file */}
      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-forest/20 bg-white px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-charcoal">{file.name}</p>
            <p className="text-xs text-charcoal/60">{formatSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            aria-label="Remove selected file"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled={!file || busy}
          onClick={handleProcess}
          className="flex-1 bg-forest text-ivory hover:bg-pine"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Processing…
            </>
          ) : (
            "Process with demo OCR"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onSample} className="flex-1">
          Use sample report instead
        </Button>
      </div>

      <p className="mt-4 text-xs text-charcoal/60">
        Demo data — uploads are simulated in this prototype; no file leaves your device.
      </p>
    </div>
  );
}
