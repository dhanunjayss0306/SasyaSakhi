"use client";

import { useState } from "react";
import { Droplets, Sun, Thermometer } from "lucide-react";
import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";
import { cn } from "@/lib/utils";

type CropKey = "paddy" | "cotton" | "chilli";

const CROPS: {
  key: CropKey;
  name: string;
  telugu: string;
  score: number;
  tagline: string;
  demo: {
    ph: string;
    temperature: string;
    water: string;
    note: string;
  };
}[] = [
  {
    key: "paddy",
    name: "Paddy",
    telugu: "వరి",
    score: 92,
    tagline: "Thrives in the slightly acidic loams of the Godavari delta.",
    demo: {
      ph: "5.5 – 6.5 ideal",
      temperature: "25–35°C",
      water: "High — standing water",
      note: "Demo: sample soil (pH 6.1, clay loam) matches paddy closely; nitrogen top-up recommended at tillering.",
    },
  },
  {
    key: "cotton",
    name: "Cotton",
    telugu: "పత్తి",
    score: 78,
    tagline: "A strong fit for deep black soils with good drainage.",
    demo: {
      ph: "6.0 – 7.5 ideal",
      temperature: "20–30°C",
      water: "Moderate — rainfed OK",
      note: "Demo: sample soil is a partial match; potash is the limiting factor for boll development.",
    },
  },
  {
    key: "chilli",
    name: "Chilli",
    telugu: "మిరప",
    score: 85,
    tagline: "Loves warm, well-drained soils — a Guntur-region classic.",
    demo: {
      ph: "6.0 – 7.0 ideal",
      temperature: "20–32°C",
      water: "Moderate — avoid waterlogging",
      note: "Demo: sample soil suits chilli well; ensure drainage before the monsoon flush.",
    },
  },
];

function CropArt({ crop }: { crop: CropKey }) {
  if (crop === "paddy") {
    return (
      <svg viewBox="0 0 120 120" role="img" aria-label="Paddy stalks illustration" className="h-28 w-28">
        <rect x="14" y="96" width="92" height="8" rx="4" fill="#09271d" opacity="0.25" />
        {[28, 52, 76, 98].map((x, i) => (
          <g key={x}>
            <path d={`M${x} 100 C ${x - 4} 70, ${x + 4} 50, ${x} 30`} stroke="#2e6b3e" strokeWidth="4" fill="none" strokeLinecap="round" />
            {i % 2 === 0 ? (
              <ellipse cx={x - 8} cy={52} rx="10" ry="5" fill="#69a66b" transform={`rotate(-30 ${x - 8} 52)`} />
            ) : (
              <ellipse cx={x + 8} cy={58} rx="10" ry="5" fill="#7fb069" transform={`rotate(30 ${x + 8} 58)`} />
            )}
            <ellipse cx={x} cy={24} rx="7" ry="12" fill="#d5a75b" />
            <line x1={x} y1={30} x2={x} y2={18} stroke="#b98a3e" strokeWidth="2" />
          </g>
        ))}
      </svg>
    );
  }
  if (crop === "cotton") {
    return (
      <svg viewBox="0 0 120 120" role="img" aria-label="Cotton bolls illustration" className="h-28 w-28">
        <rect x="14" y="96" width="92" height="8" rx="4" fill="#09271d" opacity="0.25" />
        <path d="M60 100 C 58 76, 62 60, 60 44" stroke="#2e6b3e" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="38" cy="72" rx="13" ry="7" fill="#69a66b" transform="rotate(-24 38 72)" />
        <ellipse cx="84" cy="66" rx="13" ry="7" fill="#7fb069" transform="rotate(24 84 66)" />
        {[46, 74].map((x) => (
          <g key={x}>
            <circle cx={x} cy="38" r="13" fill="#f5f1e6" stroke="#d9dfd2" strokeWidth="2" />
            <path d={`M${x - 13} 38 a13 13 0 0 1 26 0`} stroke="#e4dcc6" strokeWidth="1.5" fill="none" />
          </g>
        ))}
        <circle cx="60" cy="24" r="12" fill="#f5f1e6" stroke="#d9dfd2" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="Chilli pods illustration" className="h-28 w-28">
      <rect x="14" y="96" width="92" height="8" rx="4" fill="#09271d" opacity="0.25" />
      <path d="M60 100 C 56 78, 64 62, 60 46" stroke="#2e6b3e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="74" rx="14" ry="7" fill="#69a66b" transform="rotate(-22 40 74)" />
      <ellipse cx="82" cy="70" rx="14" ry="7" fill="#7fb069" transform="rotate(22 82 70)" />
      <g>
        <path d="M60 48 C 52 62, 48 76, 54 88" stroke="#c0392b" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M60 48 C 68 60, 72 74, 66 86" stroke="#e74c3c" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M60 44 l-5 -8 M60 44 l5 -8" stroke="#2e6b3e" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function CropShowcase() {
  const [selected, setSelected] = useState<CropKey | null>(null);
  const active = CROPS.find((c) => c.key === selected) ?? null;

  return (
    <section id="crops" aria-labelledby="crops-heading" className="bg-sage/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-leaf">
            Crop showcase
          </p>
          <h2
            id="crops-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
          >
            Three crops, scored against your soil
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            Select a card to see sample suitability details. Scores below are
            demo values.
          </p>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-4">
          {CROPS.map((crop) => (
            <CardContainer
              key={crop.key}
              containerClassName="py-4"
              className="w-full"
            >
              <CardBody className="flex h-auto w-full max-w-xs flex-col items-center rounded-3xl border border-charcoal/10 bg-white p-8 text-center shadow-sm">
                <CardItem translateZ={30}>
                  <CropArt crop={crop.key} />
                </CardItem>
                <CardItem translateZ={20} className="mt-4">
                  <h3 className="font-display text-2xl font-semibold text-charcoal">
                    {crop.name}
                    <span className="ml-2 text-base font-normal text-charcoal/50">
                      {crop.telugu}
                    </span>
                  </h3>
                </CardItem>
                <CardItem translateZ={10} className="mt-2">
                  <p className="text-sm leading-relaxed text-charcoal/65">
                    {crop.tagline}
                  </p>
                </CardItem>
                <CardItem translateZ={20} className="mt-5 w-full">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-charcoal/70">Suitability</span>
                    <span className="font-display text-3xl font-semibold text-forest">
                      {crop.score}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-sage"
                    role="img"
                    aria-label={`${crop.name} suitability ${crop.score} percent, demo value`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-leaf to-forest"
                      style={{ width: `${crop.score}%` }}
                    />
                  </div>
                </CardItem>
                <CardItem translateZ={15} className="mt-6">
                  <button
                    type="button"
                    onClick={() => setSelected(selected === crop.key ? null : crop.key)}
                    aria-expanded={selected === crop.key}
                    aria-controls="crop-detail-panel"
                    className={cn(
                      "rounded-full px-6 py-2.5 text-sm font-semibold transition-colors",
                      selected === crop.key
                        ? "bg-charcoal text-ivory"
                        : "bg-forest text-ivory hover:bg-pine",
                    )}
                  >
                    {selected === crop.key ? "Hide details" : "View suitability"}
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>

        <div
          id="crop-detail-panel"
          aria-live="polite"
          className={cn(
            "mx-auto mt-2 max-w-3xl overflow-hidden rounded-3xl border border-charcoal/10 bg-white transition-all duration-300",
            active ? "max-h-[480px] p-8 opacity-100" : "max-h-0 border-0 p-0 opacity-0",
          )}
        >
          {active && (
            <div>
              <p className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-leaf">
                Soil suitability — {active.name}
                <span className="rounded-full bg-gold/20 px-3 py-1 normal-case tracking-normal text-charcoal/70">
                  Demo data
                </span>
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-ivory p-4">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-charcoal/50">
                    <Droplets className="size-4" aria-hidden /> Soil pH
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold text-charcoal">
                    {active.demo.ph}
                  </p>
                </div>
                <div className="rounded-2xl bg-ivory p-4">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-charcoal/50">
                    <Thermometer className="size-4" aria-hidden /> Temperature
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold text-charcoal">
                    {active.demo.temperature}
                  </p>
                </div>
                <div className="rounded-2xl bg-ivory p-4">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-charcoal/50">
                    <Sun className="size-4" aria-hidden /> Water need
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold text-charcoal">
                    {active.demo.water}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-charcoal/70">
                {active.demo.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
