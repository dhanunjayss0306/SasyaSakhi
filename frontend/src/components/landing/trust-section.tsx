import { Bot, ScanLine, SlidersHorizontal } from "lucide-react";
import { FxDottedGlow, FxGlobe } from "@/components/effects";
import type { GlobeMarker } from "@/components/ui/3d-globe";

const MARKER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='7' fill='%2369a66b'/%3E%3Ccircle cx='8' cy='8' r='3' fill='%2309271d'/%3E%3C/svg%3E";

const MARKERS: GlobeMarker[] = [
  {
    lat: 17.7,
    lng: 83.3,
    src: MARKER_SRC,
    label: "Andhra Pradesh",
  },
];

const PRINCIPLES = [
  {
    icon: ScanLine,
    title: "OCR extracts",
    description:
      "Your soil health card is read by the scanner — every value is captured, nothing is guessed.",
  },
  {
    icon: SlidersHorizontal,
    title: "Rules engine recommends",
    description:
      "Agronomy rules — not vibes — match your soil numbers to crops and fertilizer doses.",
  },
  {
    icon: Bot,
    title: "AI explains",
    description:
      "The assistant only explains what the rules found, in plain English or Telugu.",
  },
];

export function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="relative overflow-hidden bg-pine py-20 sm:py-28">
      <div aria-hidden className="absolute inset-0 opacity-40">
        <FxDottedGlow className="h-full w-full" />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-pine via-transparent to-pine"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-leaf">
            How we keep it honest
          </p>
          <h2
            id="trust-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-ivory text-balance sm:text-5xl"
          >
            Three roles, one promise: no invented numbers
          </h2>

          <ul className="mt-10 space-y-6">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-leaf/20 text-leaf">
                  <p.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ivory">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ivory/70">
                    {p.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-ivory/60">
            Prototype honesty: this page shows sample and demo data. Live
            recommendations will only appear once real soil reports and weather
            feeds are connected.
          </p>
        </div>

        <div className="text-center">
          <FxGlobe
            markers={MARKERS}
            className="h-[320px] w-full sm:h-[420px]"
            fallback={
              <div
                aria-hidden
                className="mx-auto flex h-[320px] w-full max-w-md items-center justify-center rounded-full bg-gradient-to-br from-forest to-pine shadow-2xl shadow-black/40 sm:h-[420px]"
              >
                <span className="font-display text-2xl text-ivory/60">
                  Andhra Pradesh
                </span>
              </div>
            }
          />
          <p className="mt-4 text-sm text-ivory/60">
            Built for farmers, starting in Andhra Pradesh
          </p>
        </div>
      </div>
    </section>
  );
}
