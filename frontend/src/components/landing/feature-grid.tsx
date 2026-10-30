"use client";

import {
  Beaker,
  Bot,
  CalendarDays,
  CloudSun,
  Crop,
  FileScan,
  Globe,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoredLang } from "@/lib/store";

const FEATURES = [
  {
    icon: FileScan,
    title: { en: "Soil Report Upload + OCR", te: "నేల నివేదిక అప్‌లోడ్ + OCR" },
    description: {
      en: "Snap a photo of your soil health card or upload a PDF. Text is read automatically — no typing needed.",
      te: "మీ నేల ఆరోగ్య కార్డు ఫోటో తీయండి లేదా PDF అప్‌లోడ్ చేయండి. వచనం స్వయంచాలకంగా చదవబడుతుంది — టైప్ చేయాల్సిన అవసరం లేదు.",
    },
    href: "/soil-report",
    span: "",
  },
  {
    icon: HeartPulse,
    title: { en: "Soil Health Analysis", te: "నేల ఆరోగ్య విశ్లేషణ" },
    description: {
      en: "pH, EC, organic carbon, N, P, K and micronutrients explained in plain words.",
      te: "pH, EC, సేంద్రీయ కార్బన్, N, P, K మరియు సూక్ష్మపోషకాలు సరళమైన మాటల్లో వివరించబడ్డాయి.",
    },
    href: "/soil-report",
    span: "",
  },
  {
    icon: Crop,
    title: { en: "Crop Suitability", te: "పంట అనుకూలత" },
    description: {
      en: "See which of paddy, cotton and chilli your soil suits best — with a match score for each.",
      te: "వరి, పత్తి మరియు మిరపలో మీ నేలకు ఏది బాగా సరిపోతుందో చూడండి — ప్రతిదానికి సరిపోలిక స్కోర్‌తో.",
    },
    href: "/recommendations",
    span: "",
  },
  {
    icon: Beaker,
    title: { en: "Fertilizer Planning", te: "ఎరువుల ప్రణాళిక" },
    description: {
      en: "Exact doses per acre with estimated cost, so you never over- or under-apply.",
      te: "అంచనా ఖర్చుతో ఎకరాకు ఖచ్చితమైన మోతాదులు, కాబట్టి మీరు ఎప్పుడూ ఎక్కువ లేదా తక్కువ వేయరు.",
    },
    href: "/fertilizer-planner",
    span: "",
  },
  {
    icon: CloudSun,
    title: { en: "Weather Awareness", te: "వాతావరణ అవగాహన" },
    description: {
      en: "Local conditions woven into every recommendation — sowing and spraying timed right.",
      te: "ప్రతి సిఫార్సులో స్థానిక పరిస్థితులు — విత్తడం మరియు పిచికారీ సరైన సమయంలో.",
    },
    href: "/weather",
    span: "",
  },
  {
    icon: CalendarDays,
    title: { en: "Crop Calendar", te: "పంట క్యాలెండర్" },
    description: {
      en: "A season plan from land preparation to harvest, matched to your crop and region.",
      te: "భూమి తయారీ నుండి కోత వరకు సీజన్ ప్రణాళిక, మీ పంట మరియు ప్రాంతానికి అనుగుణంగా.",
    },
    href: "/crop-calendar",
    span: "",
  },
  {
    icon: Bot,
    title: { en: "AI Assistant", te: "AI సహాయకుడు" },
    description: {
      en: "Ask follow-up questions about your soil and crops — answers grounded in your own report.",
      te: "మీ నేల మరియు పంటల గురించి తదుపరి ప్రశ్నలు అడగండి — సమాధానాలు మీ స్వంత నివేదికపై ఆధారపడి ఉంటాయి.",
    },
    href: "/assistant",
    span: "",
  },
  {
    icon: Globe,
    title: { en: "Telugu & English", te: "తెలుగు & ఇంగ్లీష్" },
    description: {
      en: "Every screen, report and answer in the language you are comfortable with.",
      te: "ప్రతి స్క్రీన్, నివేదిక మరియు సమాధానం మీకు సౌకర్యవంతమైన భాషలో.",
    },
    href: "/assistant",
    span: "",
  },
];

export function FeatureGrid() {
  const lang = useStoredLang();
  const te = lang === "te";
  return (
    <section id="features" aria-labelledby="features-heading" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-forest">
            {te ? "ఫీచర్లు" : "Features"}
          </p>
          <h2
            id="features-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
          >
            {te
              ? "మీ నేల నివేదిక మీకు చెప్పాలనుకున్నదంతా"
              : "Everything your soil report was trying to tell you"}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            {te
              ? "మీ నేల ఆరోగ్య కార్డు ఫోటో నుండి పూర్తి సీజన్ ప్రణాళిక వరకు — మీ భూమి చుట్టూ కలిసి పనిచేసే ఎనిమిది సాధనాలు."
              : "From a photo of your soil health card to a full season plan — eight tools that work together around one thing: your land."}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <a
              key={feature.title.en}
              href={feature.href}
              aria-label={`${te ? feature.title.te : feature.title.en} — ${te ? "తెరవండి" : "open"}`}
              className={cn(
                "group relative flex flex-col rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-leaf/40 hover:shadow-lg hover:shadow-forest/10",
                feature.span,
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sage text-forest transition-colors group-hover:bg-forest group-hover:text-ivory">
                <feature.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-charcoal">
                {te ? feature.title.te : feature.title.en}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/65">
                {te ? feature.description.te : feature.description.en}
              </p>
              <span className="mt-4 text-sm font-medium text-forest">
                {te ? "తెరవండి →" : "Open →"}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
