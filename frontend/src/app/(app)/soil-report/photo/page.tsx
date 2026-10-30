"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_SOIL_REPORT } from "@/lib/mock-data";
import { store, useStoredLang } from "@/lib/store";

/**
 * Soil photo path: the farmer takes (or picks) a photo of the soil itself
 * and attaches it. Honest limit, stated on screen: the app has no model
 * that reads soil properties from a photo of dirt — OCR reads text from
 * documents, not nutrients from soil colour. So a photo carries only
 * what it can realistically hint at: soil colour suggests organic matter,
 * roughly, so only the organic-carbon value carries over (labelled demo).
 * pH, EC, N, P and K stay blank for the farmer to fill from a lab test
 * on the review screen. No random values: random numbers could be
 * impossible (pH 19, negative nitrogen) and would break the crop and
 * fertilizer logic downstream.
 */
export default function SoilPhotoPage() {
  const router = useRouter();
  const lang = useStoredLang();
  const te = lang === "te";
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
    // Only what a photo can realistically hint at: soil colour suggests
    // organic matter, roughly — so only the organic-carbon value carries
    // over (labelled demo). pH, EC, N, P and K cannot be read from a photo
    // at all, so they stay blank for the farmer to fill from a lab test
    // on the review screen (confirming requires all six values).
    const report = structuredClone(SAMPLE_SOIL_REPORT);
    report.id = `photo-${Date.now()}`;
    report.fileName = file.name;
    report.uploadedAt = new Date().toISOString();
    report.parameters = report.parameters.map((p) =>
      p.key === "oc"
        ? { ...p, status: "unknown" as const, uncertain: true }
        : { ...p, value: null, status: "unknown" as const, uncertain: true },
    );
    store.setReport(report);
    router.push("/soil-report/review");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          {te ? "నేల ఫోటో" : "Soil Photo"}
        </h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {te
            ? "మీ నేల ఫోటో తీసి జతచేయండి. ఫోన్‌లో ఇది కెమెరాను తెరుస్తుంది; కంప్యూటర్‌లో ఫైల్ పికర్‌ను తెరుస్తుంది."
            : "Take a photo of your soil and attach it. On a phone this opens the camera; on a computer it opens the file picker."}
        </p>
      </header>

      {!file ? (
        <label
          htmlFor="soil-photo-input"
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-forest/40 bg-white px-6 py-12 text-center hover:bg-sage/40"
        >
          <Camera className="h-10 w-10 text-forest" aria-hidden="true" />
          <span className="font-semibold text-charcoal">{te ? "నేల ఫోటో తీయండి లేదా ఎంచుకోండి" : "Take or choose a soil photo"}</span>
          <span className="text-sm text-charcoal/70">{te ? "JPG లేదా PNG, ఒక ఫోటో" : "JPG or PNG, one photo"}</span>
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
              alt={te ? "జతచేసిన నేల ఫోటో" : "Attached soil photo"}
              width={800}
              height={600}
              className="h-auto w-full rounded-xl object-cover"
              unoptimized
            />
          )}
          <p className="mt-3 text-sm font-medium text-charcoal">{file.name}</p>
          <p className="mt-1 text-sm text-charcoal/70">
            {te
              ? "ఫోటో జతచేయబడింది. ఫోటో నుండి, కేవలం సుమారు సేంద్రీయ కార్బన్ సూచన మాత్రమే సాధ్యం — నేల రంగు సేంద్రీయ పదార్థాన్ని సూచిస్తుంది, కానీ అది ల్యాబ్ విలువ కాదు. pH, EC, నత్రజని, భాస్వరం మరియు పొటాషియం ఫోటో నుండి చదవబడవు, కాబట్టి తదుపరి స్క్రీన్‌లో ల్యాబ్ పరీక్ష నుండి నింపడానికి అవి ఖాళీగా ఉంటాయి. ఇక్కడ ఏదీ మీ ఫోటో నుండి కొలిచినట్లు చూపబడలేదు."
              : "Photo attached. From a photo, only a rough organic-carbon hint is possible — soil colour suggests organic matter, but it is not a lab value. pH, EC, nitrogen, phosphorus and potassium cannot be read from a photo, so they stay blank for you to fill from a lab test on the next screen. Nothing here is presented as measured from your photo."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-forest text-ivory hover:bg-pine"
            >
              {te ? "పాక్షిక విలువలతో కొనసాగండి" : "Continue with partial values"}
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
              {te ? "వేరే ఫోటో వాడండి" : "Use a different photo"}
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
        {te ? "ఎంపికలకు వెనుకకు" : "Back to options"}
      </button>
    </div>
  );
}
