import {
  Beaker,
  Bot,
  Crop,
  FlaskConical,
  ListChecks,
  ScanLine,
  Upload,
} from "lucide-react";
import { FxCubesGrid } from "@/components/effects";

const STEPS = [
  {
    icon: Upload,
    title: "Upload",
    description:
      "Take a photo of your soil health card or upload the PDF from the lab.",
  },
  {
    icon: ScanLine,
    title: "Extract",
    description:
      "OCR reads pH, EC, organic carbon, N, P, K and micronutrients automatically.",
  },
  {
    icon: ListChecks,
    title: "Review",
    description:
      "You confirm the extracted values — nothing moves forward without your yes.",
  },
  {
    icon: FlaskConical,
    title: "Analyze",
    description:
      "The rules engine scores your soil health and flags deficiencies.",
  },
  {
    icon: Crop,
    title: "Crop suitability",
    description:
      "Paddy, cotton and chilli are matched against your soil with clear scores.",
  },
  {
    icon: Beaker,
    title: "Nutrients",
    description:
      "Fertilizer doses per acre with estimated costs, crop by crop.",
  },
  {
    icon: Bot,
    title: "AI assistant",
    description:
      "Ask anything about your soil in English or Telugu — answers grounded in your report.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative overflow-hidden bg-forest py-20 sm:py-28"
    >
      <div aria-hidden className="absolute inset-0 opacity-25">
        <FxCubesGrid className="h-full w-full" />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-forest via-forest/70 to-forest"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-leaf">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-ivory text-balance sm:text-5xl"
          >
            Seven steps from soil sample to confident sowing
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ivory/70">
            A guided flow that keeps you in control — the machine reads, the
            rules calculate, and you approve every step.
          </p>
        </div>

        <ol className="mt-12 grid gap-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-3xl border border-white/10 bg-pine/60 p-6 backdrop-blur transition-colors hover:border-leaf/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-leaf/20 text-leaf">
                  <step.icon className="size-6" aria-hidden />
                </span>
                <span
                  aria-hidden
                  className="font-display text-4xl font-semibold text-white/15"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ivory">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/70">
                {step.description}
              </p>
            </li>
          ))}
          <li className="flex items-center justify-center rounded-3xl border border-dashed border-gold/40 bg-gold/10 p-6 text-center">
            <p className="font-display text-lg font-medium leading-relaxed text-gold">
              Your season plan,
              <br />
              ready to print & share.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
