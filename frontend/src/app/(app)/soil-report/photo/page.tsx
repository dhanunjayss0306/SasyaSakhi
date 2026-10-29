"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_SOIL_REPORT } from "@/lib/mock-data";
import { store } from "@/lib/store";

/**
 * Soil photo path: the farmer takes (or picks) a photo of the soil itself
 * and attaches it. Honest limit, stated on screen: the app has no model
 * that reads soil properties from a photo of dirt — OCR reads text from
 * documents, not nutrients from soil colour. So continuing uses the
 * clearly labelled demo values (the same sample the review page already
 * marks "Demo data — edit freely"), never numbers presented as analysis
 * of the photo. No random values: random numbers could be impossible
 * (pH 19, negative nitrogen) and would break the crop and fertilizer
 * logic downstream.
 */
export default function SoilPhotoPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFile(f: File | undefined) {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleContinue() {
    if (!file) return;
    const report = structuredClone(SAMPLE_SOIL_REPORT);
    report.id = `photo-${Date.now()}`;
    report.fileName = file.name;
    report.uploadedAt = new Date().toISOString();
    store.setReport(report);
    router.push("/soil-report/review");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          Soil Photo
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Take a photo of your soil and attach it. On a phone this opens
          the camera; on a computer it opens the file picker.
        </p>
      </header>

      {!file ? (
        <label
          htmlFor="soil-photo-input"
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-forest/40 bg-white px-6 py-12 text-center hover:bg-sage/40"
        >
          <Camera className="h-10 w-10 text-forest" aria-hidden="true" />
          <span className="font-semibold text-charcoal">Take or choose a soil photo</span>
          <span className="text-sm text-charcoal/70">JPG or PNG, one photo</span>
          <input
            id="soil-photo-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="rounded-2xl border border-forest/20 bg-white px-5 py-5">
          {preview && (
            <Image
              src={preview}
              alt="Attached soil photo"
              width={800}
              height={600}
              className="h-auto w-full rounded-xl object-cover"
              unoptimized
            />
          )}
          <p className="mt-3 text-sm font-medium text-charcoal">{file.name}</p>
          <p className="mt-1 text-sm text-charcoal/70">
            Photo attached. Photo analysis is not built yet, so continuing
            uses clearly labelled demo values — the review screen marks
            them “Demo data — edit freely”. Nothing here is presented as
            measured from your photo.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-forest text-ivory hover:bg-pine"
            >
              Continue with demo values
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setFile(null);
                setPreview(null);
              }}
              className="flex-1"
            >
              Use a different photo
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push("/soil-report")}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-sage bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-sage/60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to options
      </button>
    </div>
  );
}
