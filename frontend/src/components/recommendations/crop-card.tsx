"use client";

import type { Crop, CropId } from "@/types/crop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Droplets } from "lucide-react";

interface CropCardProps {
  crop: Crop;
  selected: boolean;
  onSelect: (id: CropId) => void;
}

/** Premium inline SVG crop illustrations — no emoji, no external assets. */
function CropArt({ id }: { id: CropId }) {
  const common = "h-16 w-16";
  if (id === "paddy") {
    return (
      <svg viewBox="0 0 64 64" className={common} role="img" aria-label="Paddy stalk illustration">
        <circle cx="32" cy="32" r="30" fill="#DDE8D7" />
        <path d="M32 52 C32 40 31 30 32 16" stroke="#123D2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M32 40 C26 38 22 34 20 28" stroke="#123D2A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M32 40 C38 38 42 34 44 28" stroke="#123D2A" strokeWidth="2" fill="none" strokeLinecap="round" />
        {[22, 28, 34, 40].map((y, i) => (
          <g key={y}>
            <ellipse cx={32 + (i % 2 === 0 ? -2.5 : 2.5)} cy={y} rx="4.2" ry="6.5"
              fill={i % 2 === 0 ? "#69A66B" : "#D5A75B"} transform={`rotate(${i % 2 === 0 ? -18 : 18} 32 ${y})`} />
          </g>
        ))}
        <ellipse cx="21" cy="27" rx="3.6" ry="5.6" fill="#69A66B" transform="rotate(-30 21 27)" />
        <ellipse cx="43" cy="27" rx="3.6" ry="5.6" fill="#D5A75B" transform="rotate(30 43 27)" />
        <ellipse cx="32" cy="14" rx="3.8" ry="5.8" fill="#D5A75B" />
      </svg>
    );
  }
  if (id === "cotton") {
    return (
      <svg viewBox="0 0 64 64" className={common} role="img" aria-label="Cotton boll illustration">
        <circle cx="32" cy="32" r="30" fill="#DDE8D7" />
        <path d="M32 52 L32 44" stroke="#123D2A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="26" cy="34" r="8" fill="#F7F6EF" stroke="#1C2821" strokeWidth="1.2" opacity="0.98" />
        <circle cx="38" cy="34" r="8" fill="#F7F6EF" stroke="#1C2821" strokeWidth="1.2" opacity="0.98" />
        <circle cx="32" cy="28" r="8.5" fill="#F7F6EF" stroke="#1C2821" strokeWidth="1.2" />
        <path d="M18 44 C24 40 26 40 32 42 C38 40 40 40 46 44 C42 48 38 49 32 49 C26 49 22 48 18 44 Z" fill="#123D2A" />
        <path d="M18 44 C24 46 40 46 46 44" stroke="#69A66B" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={common} role="img" aria-label="Red chillies illustration">
      <circle cx="32" cy="32" r="30" fill="#DDE8D7" />
      <path d="M22 46 C26 38 34 34 42 34 C34 38 28 42 25 49 Z" fill="#C0392B" />
      <path d="M28 52 C30 42 38 36 46 34 C38 40 32 46 31 54 Z" fill="#A93226" />
      <path d="M42 34 C44 32 47 31 49 32 C47 34 44 35 42 34 Z" fill="#123D2A" />
      <path d="M46 34 C48 33 51 33 53 34" stroke="#123D2A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M46 34 C47 31 50 30 52 30" stroke="#69A66B" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const WATER_STYLE: Record<Crop["waterNeed"], string> = {
  Low: "bg-sage text-forest",
  Medium: "bg-gold/20 text-charcoal",
  High: "bg-forest/10 text-forest",
};

export function CropCard({ crop, selected, onSelect }: CropCardProps) {
  return (
    <article
      data-selected={selected}
      className={cn(
        "flex flex-col rounded-2xl border bg-ivory p-5 transition-shadow",
        selected
          ? "border-forest shadow-[0_8px_30px_rgba(18,61,42,0.18)]"
          : "border-sage hover:shadow-[0_6px_24px_rgba(18,61,42,0.10)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <CropArt id={crop.id} />
        <span className="rounded-full bg-forest px-3 py-1 font-display text-lg font-semibold text-ivory">
          {crop.suitability}%
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl font-semibold text-charcoal">
        {crop.name} <span className="text-base font-normal text-forest/70">· {crop.nameTe}</span>
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-charcoal/70">{crop.description}</p>

      <div className="mt-4" aria-label={`Suitability for ${crop.name}: ${crop.suitability} percent`}>
        <div className="h-2 overflow-hidden rounded-full bg-sage" role="progressbar"
          aria-valuenow={crop.suitability} aria-valuemin={0} aria-valuemax={100}
          aria-label={`${crop.name} suitability`}>
          <div className="h-full rounded-full bg-gradient-to-r from-leaf to-forest"
            style={{ width: `${crop.suitability}%` }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-sage px-2.5 py-1 font-medium text-forest">{crop.season}</span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium", WATER_STYLE[crop.waterNeed])}>
          <Droplets className="h-3 w-3" aria-hidden />
          {crop.waterNeed} water
        </span>
      </div>

      <Button
        className="mt-5 w-full"
        variant={selected ? "default" : "outline"}
        onClick={() => onSelect(crop.id)}
      >
        {selected ? "Plan selected" : "View plan"}
      </Button>
    </article>
  );
}
