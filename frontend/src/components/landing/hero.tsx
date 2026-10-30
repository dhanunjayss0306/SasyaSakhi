"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, FlaskConical, Sprout, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoredLang } from "@/lib/store";

/** The 7-step process, shown by the "How to Use This" guide. Same journey
 *  as the app itself: language first, soil report in, guidance out. */
const HOW_TO_USE_STEPS: { title: { en: string; te: string }; detail: { en: string; te: string } }[] = [
  {
    title: { en: "Choose your language", te: "మీ భాషను ఎంచుకోండి" },
    detail: { en: "English or Telugu — the whole app, including Sakhi's answers, follows your choice.", te: "ఇంగ్లీష్ లేదా తెలుగు — సఖి సమాధానాలతో సహా మొత్తం యాప్ మీ ఎంపికను అనుసరిస్తుంది." },
  },
  {
    title: { en: "Upload your soil report", te: "మీ నేల నివేదికను అప్‌లోడ్ చేయండి" },
    detail: { en: "A lab soil health card as a PDF or photo — or try the sample report first.", te: "ల్యాబ్ నేల ఆరోగ్య కార్డును PDF లేదా ఫోటోగా — లేదా ముందు నమూనా నివేదికను ప్రయత్నించండి." },
  },
  {
    title: { en: "Review and confirm the values", te: "విలువలను సమీక్షించి నిర్ధారించండి" },
    detail: { en: "Check what was read from your report and fix anything before analysis.", te: "మీ నివేదిక నుండి చదివినదాన్ని తనిఖీ చేసి, విశ్లేషణకు ముందు ఏదైనా సరిచేయండి." },
  },
  {
    title: { en: "See your soil analysis", te: "మీ నేల విశ్లేషణ చూడండి" },
    detail: { en: "What each value (pH, EC, organic carbon, N, P, K) means for your field.", te: "ప్రతి విలువ (pH, EC, సేంద్రీయ కార్బన్, N, P, K) మీ పొలానికి అర్థం ఏమిటి." },
  },
  {
    title: { en: "See which crops match", te: "ఏ పంటలు సరిపోతాయో చూడండి" },
    detail: { en: "Paddy, cotton and chilli, scored against your soil by the rules engine.", te: "వరి, పత్తి మరియు మిరప — నియమాల ఇంజిన్ ద్వారా మీ నేలకు స్కోర్ చేయబడ్డాయి." },
  },
  {
    title: { en: "Get your fertilizer plan", te: "మీ ఎరువుల ప్రణాళిక పొందండి" },
    detail: { en: "How much urea, DAP and MOP for the crop you pick, for your area.", te: "మీరు ఎంచుకున్న పంటకు, మీ విస్తీర్ణానికి ఎంత యూరియా, DAP మరియు MOP." },
  },
  {
    title: { en: "Weather, calendar and Sakhi", te: "వాతావరణం, క్యాలెండర్ మరియు సఖి" },
    detail: { en: "Field weather, your season tasks, and Sakhi in the corner for any question.", te: "పొలం వాతావరణం, మీ సీజన్ పనులు, మరియు ఏ ప్రశ్నకైనా మూలలో సఖి." },
  },
];

function HowToUseGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const lang = useStoredLang();
  const te = lang === "te";
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
              {te ? "SasyaSakhi ని ఎలా వాడాలి" : "How to use SasyaSakhi"}
            </h2>
            <p className="mt-1 text-sm text-charcoal/65">
              {te
                ? "మీ నేల నివేదిక నుండి విత్తే నిర్ణయం వరకు ఏడు దశలు."
                : "Seven steps from your soil report to a sowing decision."}
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
            <li key={step.title.en} className="flex gap-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest font-display text-sm font-semibold text-ivory">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-charcoal">{te ? step.title.te : step.title.en}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-charcoal/70">
                  {te ? step.detail.te : step.detail.en}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-xl bg-gold/15 p-4 text-sm leading-relaxed text-charcoal/75">
          {te ? (
            <>
              ఇప్పటికే పంట వేసి, నేల నివేదిక లేదా? బదులుగా{" "}
              <span className="font-semibold text-charcoal">నాకు ఇప్పటికే పంట ఉంది</span>{" "}
              వాడండి — ఇది మీ పంట మరియు జిల్లా నుండే మార్గనిర్దేశం చేస్తుంది.
            </>
          ) : (
            <>
              Already growing a crop and have no soil report? Use{" "}
              <span className="font-semibold text-charcoal">I Already Have a Crop</span>{" "}
              instead — it guides you from your crop and district alone.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Frosted-glass sample card, restyled to the preview's structure. Values
 *  and labelling are the real app's own sample values — no farm, district
 *  or report number is claimed, because this card has none. */
function SampleInsightCard() {
  const lang = useStoredLang();
  const te = lang === "te";
  return (
    <div className="rounded-3xl border border-white/25 bg-forest/60 shadow-2xl shadow-pine/40 backdrop-blur-md">
      <div className="p-5 text-left text-ivory sm:p-6">
        <p className="flex items-center gap-2 font-display text-lg font-semibold">
          <FlaskConical className="size-5 text-gold" aria-hidden />
          {te ? "నేల అంతర్దృష్టి" : "Soil insight"}
          <span className="ml-auto rounded-full border border-white/30 px-2.5 py-0.5 font-sans text-[11px] font-medium normal-case tracking-normal text-ivory/85">
            {te ? "నమూనా" : "Sample"}
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
        <p className="mt-5 font-semibold text-ivory">{te ? "ఉత్తమ సరిపోలిక: వరి" : "Best match: Paddy"}</p>
        <p className="mt-1 text-sm leading-relaxed text-ivory/80">
          {te
            ? "కొద్దిగా ఆమ్ల లోమ్ — వరికి మంచిది. నాటే ముందు ఎకరాకు 25 కిలోల MOP వేయండి."
            : "Slightly acidic loam — good for paddy. Add 25 kg/acre MOP before transplanting."}
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
          {te ? "నమూనా విశ్లేషణ చూడండి" : "View sample analysis"}
        </Link>
      </div>
    </div>
  );
}

export function Hero() {
  const [guideOpen, setGuideOpen] = useState(false);
  const lang = useStoredLang();
  const te = lang === "te";

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
            {te ? "భారతీయ రైతులకు AI మార్గదర్శకత్వం" : "AI guidance for Indian farmers"}
          </p>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-ivory text-balance sm:text-6xl xl:text-7xl">
            <span className="block">{te ? "మీ నేల." : "Your Soil."}</span>
            <span className="block italic text-gold">{te ? "మీ మద్దతు." : "Your Support."}</span>
            <span className="block">{te ? "మెరుగైన వ్యవసాయం." : "Better Farming."}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/85 lg:mx-0">
            {te
              ? "మీ నేల పరీక్ష నివేదికను అప్‌లోడ్ చేయండి మరియు స్పష్టమైన సమాధానాలు పొందండి: మీ నేలకు ఏమి కావాలి, ఏ పంటలు సరిపోతాయి, మరియు ఎంత ఎరువు వాడాలి — తెలుగు లేదా ఇంగ్లీష్‌లో."
              : "Upload your soil test report and get clear answers: what your soil needs, which crops suit it, and exactly how much fertilizer to use — in English or Telugu."}
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
              {te ? "నా నేలను విశ్లేషించండి" : "Analyze My Soil"}
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
              {te ? "నాకు ఇప్పటికే పంట ఉంది" : "I Already Have a Crop"}
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
              {te ? "దీన్ని ఎలా వాడాలి" : "How to Use This"}
            </button>
          </div>

          <p className="mt-6 text-sm text-ivory/70">
            {te
              ? "ఉచిత నమూనా · డెమో ప్రయత్నించడానికి ఖాతా అవసరం లేదు · ఏ ఫోన్‌లోనైనా పనిచేస్తుంది"
              : "Free prototype · No account needed to try the demo · Works on any phone"}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:col-span-5 lg:mx-0 lg:justify-self-end">
          <SampleInsightCard />
          <p className="mt-3 text-center text-xs text-ivory/60">
            {te ? "నమూనా ముందస్తు చూపు — మీ నివేదికే ఇన్‌పుట్ అవుతుంది." : "Sample preview — your report becomes the input."}
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
