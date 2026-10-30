"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoredLang } from "@/lib/store";

const PRINCIPLES = [
  {
    title: { en: "OCR extracts", te: "OCR సంగ్రహిస్తుంది" },
    description: {
      en: "Your soil health card is read by the scanner — every value is captured, nothing is guessed.",
      te: "మీ నేల ఆరోగ్య కార్డును స్కానర్ చదువుతుంది — ప్రతి విలువ సంగ్రహించబడుతుంది, ఏమీ ఊహించబడదు.",
    },
  },
  {
    title: { en: "Rules engine recommends", te: "నియమాల ఇంజిన్ సిఫార్సు చేస్తుంది" },
    description: {
      en: "Agronomy rules — not vibes — match your soil numbers to crops and fertilizer doses.",
      te: "వ్యవసాయ నియమాలు — ఊహలు కాదు — మీ నేల సంఖ్యలను పంటలు మరియు ఎరువుల మోతాదులతో సరిపోల్చుతాయి.",
    },
  },
  {
    title: { en: "AI explains", te: "AI వివరిస్తుంది" },
    description: {
      en: "The assistant only explains what the rules found, in plain English or Telugu.",
      te: "సహాయకుడు నియమాలు కనుగొన్నదాన్ని మాత్రమే సరళమైన ఇంగ్లీష్ లేదా తెలుగులో వివరిస్తాడు.",
    },
  },
];

export function TrustSection() {
  const lang = useStoredLang();
  const te = lang === "te";
  return (
    <section aria-labelledby="trust-heading" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-12 shadow-xl shadow-forest/20 sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(rgba(247,246,239,0.14)_1px,transparent_1.5px)] [background-size:22px_22px]"
          />
          <div className="relative z-10">
            <p className="inline-flex items-center rounded-full bg-pine px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold">
              {te ? "మేము నిజాయితీని ఎలా కాపాడుతాము" : "How we keep it honest"}
            </p>
            <h2
              id="trust-heading"
              className="mt-5 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ivory text-balance sm:text-5xl"
            >
              {te ? "మూడు పాత్రలు, ఒక వాగ్దానం: కల్పిత సంఖ్యలు లేవు" : "Three roles, one promise: no invented numbers"}
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ivory/70">
              {te
                ? "స్కానర్ చదువుతుంది, నియమాలు లెక్కిస్తాయి, మరియు సహాయకుడు మాత్రమే వివరిస్తాడు — కాబట్టి మీరు చూసే ప్రతి సంఖ్య మీ నివేదికకే తిరిగి వెళుతుంది."
                : "The scanner reads, the rules calculate, and the assistant only explains — so every number you see traces back to your report."}
            </p>

            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <div key={p.title.en}>
                  <p
                    aria-hidden
                    className="font-display text-3xl font-semibold text-gold"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-ivory">
                    {te ? p.title.te : p.title.en}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ivory/70">
                    {te ? p.description.te : p.description.en}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/soil-report"
                className={cn(
                  buttonVariants({
                    size: "lg",
                    className: "rounded-full bg-gold px-7 text-charcoal hover:bg-gold/90",
                  }),
                )}
              >
                {te ? "నా నేలను విశ్లేషించండి" : "Analyze My Soil"}
              </Link>
              <Link
                href="/recommendations"
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className:
                      "rounded-full border-white/40 bg-transparent px-7 text-ivory hover:bg-white/10 hover:text-ivory",
                  }),
                )}
              >
                {te ? "పంట సిఫార్సులు చూడండి" : "See crop recommendations"}
              </Link>
            </div>

            <p className="mt-8 text-sm leading-relaxed text-ivory/50">
              {te
                ? "నమూనా నిజాయితీ: ఈ పేజీ నమూనా మరియు డెమో డేటాను చూపిస్తుంది. నిజమైన నేల నివేదికలు మరియు వాతావరణ ఫీడ్‌లు కనెక్ట్ అయిన తర్వాత మాత్రమే ప్రత్యక్ష సిఫార్సులు కనిపిస్తాయి."
                : "Prototype honesty: this page shows sample and demo data. Live recommendations will only appear once real soil reports and weather feeds are connected."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
