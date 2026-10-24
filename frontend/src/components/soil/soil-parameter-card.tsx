import { CheckCircle2, AlertTriangle, ArrowUpCircle, HelpCircle } from "lucide-react";
import type { SoilParameter, ParamStatus } from "@/types/soil";

const EXPLANATIONS: Record<SoilParameter["key"], string> = {
  ph: "Soil acidity — 6.0–7.0 is the sweet spot where most crops take up nutrients best.",
  ec: "Saltiness of the soil — too much salt stresses roots and burns young plants.",
  oc: "Organic matter — feeds soil life and holds moisture; higher is better.",
  n: "Nitrogen fuels green leafy growth — low nitrogen means pale leaves and slow growth.",
  p: "Phosphorus builds strong roots and flowering — most needed at sowing time.",
  k: "Potassium strengthens stems and fights disease — too much can block other nutrients.",
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

const STATUS_LABEL: Record<ParamStatus, string> = {
  optimal: "Optimal",
  low: "Low",
  high: "High",
  unknown: "Unknown",
};

export function SoilParameterCard({ parameter }: { parameter: SoilParameter }) {
  const style = STATUS_STYLE[parameter.status];
  const Icon = style.icon;

  return (
    <article className="rounded-2xl border border-forest/15 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">{parameter.label}</h3>
          <p className="text-xs text-charcoal/60">{parameter.labelTe}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {STATUS_LABEL[parameter.status]}
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
      <p className="mt-2 text-sm text-charcoal/70">{EXPLANATIONS[parameter.key]}</p>
    </article>
  );
}
