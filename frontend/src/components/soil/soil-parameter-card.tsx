"use client";

import { CheckCircle2, AlertTriangle, ArrowUpCircle, HelpCircle } from "lucide-react";
import type { SoilParameter, ParamStatus } from "@/types/soil";
import { useStoredLang } from "@/lib/store";

const EXPLANATIONS: Record<SoilParameter["key"], { en: string; te: string }> = {
  ph: {
    en: "Soil acidity — 6.0–7.0 is the sweet spot where most crops take up nutrients best.",
    te: "నేల ఆమ్లత — 6.0–7.0 అనేది చాలా పంటలు పోషకాలను బాగా గ్రహించే సరైన పరిధి.",
  },
  ec: {
    en: "Saltiness of the soil — too much salt stresses roots and burns young plants.",
    te: "నేల ఉప్పదనం — ఎక్కువ ఉప్పు వేర్లను ఒత్తిడికి గురిచేసి చిన్న మొక్కలను కాలుస్తుంది.",
  },
  oc: {
    en: "Organic matter — feeds soil life and holds moisture; higher is better.",
    te: "సేంద్రీయ పదార్థం — నేల జీవాన్ని పోషించి తేమను నిలుపుతుంది; ఎక్కువ ఉంటే మంచిది.",
  },
  n: {
    en: "Nitrogen fuels green leafy growth — low nitrogen means pale leaves and slow growth.",
    te: "నత్రజని ఆకుపచ్చ ఆకు పెరుగుదలకు ఇంధనం — తక్కువ నత్రజని అంటే పాలిపోయిన ఆకులు మరియు నెమ్మది పెరుగుదల.",
  },
  p: {
    en: "Phosphorus builds strong roots and flowering — most needed at sowing time.",
    te: "భాస్వరం బలమైన వేర్లు మరియు పుష్పించడాన్ని నిర్మిస్తుంది — విత్తే సమయంలో ఎక్కువగా అవసరం.",
  },
  k: {
    en: "Potassium strengthens stems and fights disease — too much can block other nutrients.",
    te: "పొటాషియం కాండాలను బలపరుస్తుంది మరియు వ్యాధులతో పోరాడుతుంది — ఎక్కువ ఉంటే ఇతర పోషకాలను అడ్డుకుంటుంది.",
  },
};

const STATUS_STYLE: Record<ParamStatus, { pill: string; icon: typeof CheckCircle2 }> = {
  optimal: {
    pill: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  low: {
    pill: "bg-amber-100 text-amber-800",
    icon: AlertTriangle,
  },
  high: {
    pill: "bg-red-100 text-red-800",
    icon: ArrowUpCircle,
  },
  unknown: {
    pill: "bg-charcoal/10 text-charcoal/70",
    icon: HelpCircle,
  },
};

const STATUS_LABEL: Record<ParamStatus, { en: string; te: string }> = {
  optimal: { en: "Optimal", te: "ఆదర్శం" },
  low: { en: "Low", te: "తక్కువ" },
  high: { en: "High", te: "ఎక్కువ" },
  unknown: { en: "Unknown", te: "తెలియదు" },
};

export function SoilParameterCard({ parameter }: { parameter: SoilParameter }) {
  const style = STATUS_STYLE[parameter.status];
  const Icon = style.icon;
  const lang = useStoredLang();
  const te = lang === "te";

  return (
    <article className="rounded-2xl border border-forest/15 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">{te ? parameter.labelTe : parameter.label}</h3>
          <p className="text-xs text-charcoal/60">{te ? parameter.label : parameter.labelTe}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {te ? STATUS_LABEL[parameter.status].te : STATUS_LABEL[parameter.status].en}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-charcoal">
        {parameter.value === null ? "—" : parameter.value}
        {parameter.unit && (
          <span className="ml-1 text-base font-normal text-charcoal/60">
            {parameter.unit}
          </span>
        )}
      </p>
      <p className="mt-2 text-sm text-charcoal/70">{te ? EXPLANATIONS[parameter.key].te : EXPLANATIONS[parameter.key].en}</p>
    </article>
  );
}
