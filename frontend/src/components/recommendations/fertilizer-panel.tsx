"use client";

import { useState } from "react";
import type { FertilizerRec } from "@/types/recommendation";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";

interface FertilizerPanelProps {
  cropName: string;
  items: FertilizerRec[];
  /**
   * Backend-calculated plan. When present, quantities come from the backend
   * (no prices — the backend has none configured) and the illustrative
   * badge/footnote are replaced by a plain "Live" note. When absent, the
   * mock illustrative plan renders exactly as before.
   */
  live?: LiveFertilizerPlan | null;
}

export interface LiveFertilizerItem {
  product: string;
  nutrient: string;
  quantity: number;
  unit: string;
}

export interface LiveFertilizerPlan {
  items: LiveFertilizerItem[];
  ruleId?: string | null;
  explanation: string;
  area: number;
  areaUnit: string;
  totalCost?: number | null;
  currency?: string;
}

function FertilizerRow({ item }: { item: FertilizerRec }) {
  const [open, setOpen] = useState(false);
  const rowId = `fert-${item.product.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="rounded-xl border border-sage bg-ivory">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={rowId}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]"
      >
        <div>
          <p className="font-semibold text-charcoal">{item.product}</p>
          <p className="text-xs text-charcoal/60">{item.unit}</p>
        </div>
        <span className="hidden text-sm text-charcoal/80 sm:block">{item.nutrientQty}</span>
        <span className="hidden text-sm text-charcoal/80 sm:block">{item.productQty}</span>
        <span className="hidden font-display text-base font-semibold text-forest sm:block">
          ₹{item.costPerAcre}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
          Why this?
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
        </span>
        {/* Mobile-only inline summary */}
        <span className="col-span-2 text-sm text-charcoal/80 sm:hidden">
          {item.nutrientQty} · {item.productQty} · <span className="font-semibold text-forest">₹{item.costPerAcre}</span>
        </span>
      </button>
      {open && (
        <div id={rowId} className="border-t border-sage px-4 py-3 text-sm leading-relaxed text-charcoal/75">
          <span className="font-medium text-forest">Why this? </span>
          {item.note}
        </div>
      )}
    </div>
  );
}

export function FertilizerPanel({ cropName, items, live }: FertilizerPanelProps) {
  const total = items.reduce((sum, i) => sum + i.costPerAcre, 0);
  const isLive = live != null;
  return (
    <section aria-labelledby="fert-plan-heading" className="rounded-2xl border border-forest/15 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="fert-plan-heading" className="font-display text-xl font-semibold text-charcoal">
          Fertilizer plan — {cropName}
        </h2>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-charcoal">
            <Info className="h-3.5 w-3.5" aria-hidden />
            Illustrative — confirm with your agriculture officer
          </span>
        )}
      </div>

      {isLive ? (
        <>
          <div className="mt-4 hidden grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-charcoal/50 sm:grid">
            <span>Product</span>
            <span>Nutrient</span>
            <span>Quantity</span>
            <span>Cost</span>
          </div>
          <div className="mt-2 space-y-3">
            {live.items.map((item) => (
              <div
                key={item.product}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-sage bg-ivory p-4 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr]"
              >
                <div>
                  <p className="font-semibold text-charcoal">{item.product}</p>
                  <p className="text-xs text-charcoal/60">{item.unit}</p>
                </div>
                <span className="hidden text-sm text-charcoal/80 sm:block">{item.nutrient}</span>
                <span className="hidden text-sm text-charcoal/80 sm:block">
                  {item.quantity} {item.unit}
                </span>
                <span className="hidden text-sm text-charcoal/80 sm:block">—</span>
                <span className="text-sm text-charcoal/80 sm:hidden">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
          {live.totalCost != null ? (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-forest px-4 py-3 text-ivory">
              <span className="text-sm font-medium">Estimated total</span>
              <span className="font-display text-lg font-semibold">
                {live.currency ?? "₹"}
                {live.totalCost} <span className="text-xs font-normal opacity-80">per {live.areaUnit}</span>
              </span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-charcoal/70">
              Quantities for {live.area} {live.areaUnit} · prices not configured.
            </p>
          )}
          <p className="mt-3 text-xs text-charcoal/60">
            {live.explanation}
            {live.ruleId ? ` Rule: ${live.ruleId}.` : ""}
          </p>
        </>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-sage bg-ivory p-8 text-center">
          <p className="font-medium text-charcoal">No fertilizer plan available for this crop yet.</p>
          <p className="mt-1 text-sm text-charcoal/60">
            Select another crop, or check back after the recommendation engine is connected.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-charcoal/50 sm:grid">
            <span>Product</span>
            <span>Nutrient</span>
            <span>Quantity</span>
            <span>Cost / acre</span>
            <span aria-hidden />
          </div>
          <div className="mt-2 space-y-3">
            {items.map((item) => (
              <FertilizerRow key={item.product} item={item} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-forest px-4 py-3 text-ivory">
            <span className="text-sm font-medium">Estimated total</span>
            <span className="font-display text-lg font-semibold">₹{total} <span className="text-xs font-normal opacity-80">per acre</span></span>
          </div>
          <p className="mt-3 text-xs text-charcoal/60">
            Demo data — quantities and prices are illustrative samples, not purchase advice.
          </p>
        </>
      )}
    </section>
  );
}
