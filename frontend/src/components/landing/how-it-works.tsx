"use client";

import { useStoredLang } from "@/lib/store";

const STEPS = [
  {
    title: { en: "Upload", te: "అప్‌లోడ్" },
    description: {
      en: "Take a photo of your soil health card or upload the PDF from the lab.",
      te: "మీ నేల ఆరోగ్య కార్డు ఫోటో తీయండి లేదా ల్యాబ్ నుండి PDF అప్‌లోడ్ చేయండి.",
    },
  },
  {
    title: { en: "Extract", te: "సంగ్రహణ" },
    description: {
      en: "OCR reads pH, EC, organic carbon, N, P, K and micronutrients automatically.",
      te: "OCR pH, EC, సేంద్రీయ కార్బన్, N, P, K మరియు సూక్ష్మపోషకాలను స్వయంచాలకంగా చదువుతుంది.",
    },
  },
  {
    title: { en: "Review", te: "సమీక్ష" },
    description: {
      en: "You confirm the extracted values — nothing moves forward without your yes.",
      te: "మీరు సంగ్రహించిన విలువలను నిర్ధారిస్తారు — మీ అనుమతి లేకుండా ఏమీ ముందుకు వెళ్ళదు.",
    },
  },
  {
    title: { en: "Analyze", te: "విశ్లేషణ" },
    description: {
      en: "The rules engine scores your soil health and flags deficiencies.",
      te: "నియమాల ఇంజిన్ మీ నేల ఆరోగ్యాన్ని స్కోర్ చేసి లోపాలను గుర్తిస్తుంది.",
    },
  },
  {
    title: { en: "Crop suitability", te: "పంట అనుకూలత" },
    description: {
      en: "Paddy, cotton and chilli are matched against your soil with clear scores.",
      te: "వరి, పత్తి మరియు మిరప మీ నేలతో స్పష్టమైన స్కోర్‌లతో సరిపోల్చబడతాయి.",
    },
  },
  {
    title: { en: "Nutrients", te: "పోషకాలు" },
    description: {
      en: "Fertilizer doses per acre with estimated costs, crop by crop.",
      te: "పంటల వారీగా అంచనా ఖర్చులతో ఎకరాకు ఎరువుల మోతాదులు.",
    },
  },
  {
    title: { en: "AI assistant", te: "AI సహాయకుడు" },
    description: {
      en: "Ask anything about your soil in English or Telugu — answers grounded in your report.",
      te: "మీ నేల గురించి ఏదైనా ఇంగ్లీష్ లేదా తెలుగులో అడగండి — సమాధానాలు మీ నివేదికపై ఆధారపడి ఉంటాయి.",
    },
  },
];

export function HowItWorks() {
  const lang = useStoredLang();
  const te = lang === "te";
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="bg-[#EAF0E4] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-forest">
            {te ? "ఎలా పనిచేస్తుంది" : "How it works"}
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
          >
            {te
              ? "నేల నమూనా నుండి నమ్మకమైన విత్తడం వరకు ఏడు దశలు"
              : "Seven steps from soil sample to confident sowing"}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            {te
              ? "మిమ్మల్ని నియంత్రణలో ఉంచే మార్గనిర్దేశిత ప్రవాహం — యంత్రం చదువుతుంది, నియమాలు లెక్కిస్తాయి, మరియు మీరు ప్రతి దశను ఆమోదిస్తారు."
              : "A guided flow that keeps you in control — the machine reads, the rules calculate, and you approve every step."}
          </p>
        </div>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {STEPS.map((step, i) => (
            <li
              key={step.title.en}
              className="rounded-3xl border border-charcoal/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory">
                {i + 1}
              </span>
              <h3 className="mt-4 font-sans text-base font-bold text-charcoal">
                {te ? step.title.te : step.title.en}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-charcoal/60">
                {te ? step.description.te : step.description.en}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
