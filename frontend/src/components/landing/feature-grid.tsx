import {
  Beaker,
  Bot,
  CalendarDays,
  CloudSun,
  Crop,
  FileScan,
  HeartPulse,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: FileScan,
    title: "Soil Report Upload + OCR",
    description:
      "Snap a photo of your soil health card or upload a PDF. Text is read automatically — no typing needed.",
    href: "/soil-report",
    span: "sm:col-span-2",
  },
  {
    icon: HeartPulse,
    title: "Soil Health Analysis",
    description:
      "pH, EC, organic carbon, N, P, K and micronutrients explained in plain words.",
    href: "/soil-report",
    span: "",
  },
  {
    icon: Crop,
    title: "Crop Suitability",
    description:
      "See which of paddy, cotton and chilli your soil suits best — with a match score for each.",
    href: "/recommendations",
    span: "",
  },
  {
    icon: Beaker,
    title: "Fertilizer Planning",
    description:
      "Exact doses per acre with estimated cost, so you never over- or under-apply.",
    href: "/recommendations",
    span: "",
  },
  {
    icon: CloudSun,
    title: "Weather Awareness",
    description:
      "Local conditions woven into every recommendation — sowing and spraying timed right.",
    href: "/weather",
    span: "",
  },
  {
    icon: CalendarDays,
    title: "Crop Calendar",
    description:
      "A season plan from land preparation to harvest, matched to your crop and region.",
    href: "/crop-calendar",
    span: "",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Ask follow-up questions about your soil and crops — answers grounded in your own report.",
    href: "/assistant",
    span: "",
  },
  {
    icon: Languages,
    title: "Telugu & English",
    description:
      "Every screen, report and answer in the language you are comfortable with.",
    href: "/assistant",
    span: "sm:col-span-2",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" aria-labelledby="features-heading" className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-leaf">
            Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
          >
            Everything your soil report was trying to tell you
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            From a photo of your soil health card to a full season plan — eight
            tools that work together around one thing: your land.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              aria-label={`${feature.title} — open`}
              className={cn(
                "group relative flex flex-col rounded-3xl border border-charcoal/10 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-leaf/40 hover:shadow-lg hover:shadow-forest/10",
                feature.span,
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sage text-forest transition-colors group-hover:bg-forest group-hover:text-ivory">
                <feature.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-charcoal">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/65">
                {feature.description}
              </p>
              <span className="mt-4 text-sm font-medium text-leaf opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
