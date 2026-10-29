"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, FlaskConical, Sprout, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The 7-step process, shown by the "How to Use This" guide. Same journey
 *  as the app itself: language first, soil report in, guidance out. */
const HOW_TO_USE_STEPS: { title: string; detail: string }[] = [
  {
    title: "Choose your language",
    detail: "English or Telugu — the whole app, including Sakhi's answers, follows your choice.",
  },
  {
    title: "Upload your soil report",
    detail: "A lab soil health card as a PDF or photo — or try the sample report first.",
  },
  {
    title: "Review and confirm the values",
    detail: "Check what was read from your report and fix anything before analysis.",
  },
  {
    title: "See your soil analysis",
    detail: "What each value (pH, EC, organic carbon, N, P, K) means for your field.",
  },
  {
    title: "See which crops match",
    detail: "Paddy, cotton and chilli, scored against your soil by the rules engine.",
  },
  {
    title: "Get your fertilizer plan",
    detail: "How much urea, DAP and MOP for the crop you pick, for your area.",
  },
  {
    title: "Weather, calendar and Sakhi",
    detail: "Field weather, your season tasks, and Sakhi in the corner for any question.",
  },
];

function HowToUseGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-pine/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="How to use SasyaSakhi"
    >
      <button
        type="button"
        aria-label="Close guide"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-ivory p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-charcoal">
              How to use SasyaSakhi
            </h2>
            <p className="mt-1 text-sm text-charcoal/65">
              Seven steps from your soil report to a sowing decision.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="rounded-full border border-sage bg-white p-2 text-charcoal hover:bg-sage/60"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <ol className="mt-6 space-y-4">
          {HOW_TO_USE_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest font-display text-sm font-semibold text-ivory">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-charcoal">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-charcoal/70">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-xl bg-gold/15 p-4 text-sm leading-relaxed text-charcoal/75">
          Already growing a crop and have no soil report? Use{" "}
          <span className="font-semibold text-charcoal">I Already Have a Crop</span>{" "}
          instead — it guides you from your crop and district alone.
        </p>
      </div>
    </div>
  );
}

/** Frosted-glass sample card, restyled to the preview's structure. Values
 *  and labelling are the real app's own sample values — no farm, district
 *  or report number is claimed, because this card has none. */
function SampleInsightCard() {
  return (
    <div className="rounded-3xl border border-white/25 bg-forest/60 shadow-2xl shadow-pine/40 backdrop-blur-md">
      <div className="p-5 text-left text-ivory sm:p-6">
        <p className="flex items-center gap-2 font-display text-lg font-semibold">
          <FlaskConical className="size-5 text-gold" aria-hidden />
          Soil insight
          <span className="ml-auto rounded-full border border-white/30 px-2.5 py-0.5 font-sans text-[11px] font-medium normal-case tracking-normal text-ivory/85">
            Sample
          </span>
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-pine/60 px-2 py-3">
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">pH</dt>
            <dd className="mt-1 font-display text-xl font-semibold">6.8</dd>
          </div>
          <div className="rounded-xl bg-pine/60 px-2 py-3">
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">N · P · K</dt>
            <dd className="mt-1 break-all font-display text-sm font-semibold">280·22·310</dd>
          </div>
          <div className="rounded-xl bg-pine/60 px-2 py-3">
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">OC</dt>
            <dd className="mt-1 font-display text-xl font-semibold">0.62%</dd>
          </div>
        </dl>
        <p className="mt-5 font-semibold text-ivory">Best match: Paddy</p>
        <p className="mt-1 text-sm leading-relaxed text-ivory/80">
          Slightly acidic loam — good for paddy. Add 25 kg/acre MOP before
          transplanting.
        </p>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({
              size: "lg",
              className: "mt-5 w-full rounded-full bg-gold text-charcoal hover:bg-gold/90",
            }),
          )}
        >
          View sample analysis
        </Link>
      </div>
    </div>
  );
}

export function Hero() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <section
      id="top"
      aria-label="SasyaSakhi introduction"
      className="relative flex min-h-[calc(100svh-73px)] items-center overflow-hidden bg-pine"
    >
      <HowToUseGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
      {/* Hero background: real paddy-field photograph (Pexels photo ID
          2897195, terraced green paddy with forested hill). Free to use
          under the Pexels licence; no attribution required. Dark gradient
          fading in from the bottom keeps the white text legible. */}
      <img
        src="/hero-field.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/35 to-pine/10"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-8">
        <div className="text-center lg:col-span-7 lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold backdrop-blur">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            AI guidance for Indian farmers
          </p>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-ivory text-balance sm:text-6xl xl:text-7xl">
            <span className="block">Your Soil.</span>
            <span className="block italic text-gold">Your Support.</span>
            <span className="block">Better Farming.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/85 lg:mx-0">
            Upload your soil test report and get clear answers: what your soil
            needs, which crops suit it, and exactly how much fertilizer to use —
            in English or Telugu.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 lg:flex-row lg:flex-wrap lg:items-start lg:justify-start">
            <Link
              href="/soil-report"
              className={cn(
                buttonVariants({
                  size: "lg",
                  className: "w-full rounded-full bg-gold px-7 text-charcoal hover:bg-gold/90 sm:w-auto",
                }),
              )}
            >
              Analyze My Soil
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/my-crop"
              className={cn(
                buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "w-full rounded-full border-white/40 bg-transparent px-7 text-ivory hover:bg-white/15 hover:text-ivory sm:w-auto",
                }),
              )}
            >
              <Sprout className="size-4" aria-hidden />
              I Already Have a Crop
            </Link>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className={cn(
                buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "w-full rounded-full border-white/30 bg-white/5 px-7 text-ivory hover:bg-white/15 hover:text-ivory sm:w-auto",
                }),
              )}
            >
              How to Use This
            </button>
          </div>

          <p className="mt-6 text-sm text-ivory/70">
            Free prototype · No account needed to try the demo · Works on any phone
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:col-span-5 lg:mx-0 lg:justify-self-end">
          <SampleInsightCard />
          <p className="mt-3 text-center text-xs text-ivory/60">
            Sample preview — your report becomes the input.
          </p>
        </div>
      </div>

      <a
        href="#features"
        aria-label="Scroll to features"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 p-2.5 text-ivory/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-ivory"
      >
        <ChevronDown className="size-5 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
