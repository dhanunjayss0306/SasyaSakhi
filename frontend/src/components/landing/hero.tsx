import Link from "next/link";
import { ArrowRight, ChevronDown, FlaskConical } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { FxCanvasText, FxCloudShader } from "@/components/effects";

const HERO_FALLBACK = (
  <div
    aria-hidden
    className="absolute inset-0 bg-gradient-to-b from-pine via-forest to-pine"
  />
);

function SampleInsightCard() {
  return (
    <LiquidGlass
      radius={20}
      className="border border-white/15 bg-white/10 shadow-2xl shadow-pine/40"
    >
      <div className="p-5 text-left text-ivory">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          <FlaskConical className="size-4" aria-hidden />
          Soil insight
          <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] normal-case tracking-normal">
            Sample
          </span>
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/10 px-2 py-3">
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">pH</dt>
            <dd className="mt-1 font-display text-xl font-semibold">6.8</dd>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-3">
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">N · P · K</dt>
            <dd className="mt-1 break-all font-display text-sm font-semibold">280·22·310</dd>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-3">
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">OC</dt>
            <dd className="mt-1 font-display text-xl font-semibold">0.62%</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-ivory/80">
          Slightly acidic loam — good for paddy. Add 25 kg/acre MOP before
          transplanting.
        </p>
      </div>
    </LiquidGlass>
  );
}

export function Hero() {
  return (
    <section
      id="top"
      aria-label="SasyaSakhi introduction"
      className="relative flex min-h-[calc(100svh-76px)] items-center overflow-hidden bg-pine"
    >
      <FxCloudShader
        className="absolute inset-0"
        speed={0.5}
        count={3}
        cloudColor="#69a66b"
        skyTopColor="#09271d"
        skyBottomColor="#123d2a"
        fallback={HERO_FALLBACK}
      />
      <div aria-hidden className="hero-vignette absolute inset-0" />
      <div aria-hidden className="grain absolute inset-0 opacity-20" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-pine/60 via-transparent to-pine"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-ivory/85 backdrop-blur">
            AI guidance for Indian farmers
          </p>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-ivory text-balance sm:text-6xl xl:text-7xl">
            {/* One FxCanvasText per line: the canvas effect draws a single line
                and cannot wrap, so a full-sentence canvas was clipped at the
                column edge on desktop ("Your Soil. Your Sup"). Each short
                line fits its column, so the full headline is always visible. */}
            <span className="block">
              <FxCanvasText text="Your Soil." className="font-display" />
            </span>
            <span className="block">
              <FxCanvasText text="Your Support." className="font-display" />
            </span>
            <span className="block">
              <FxCanvasText text="Better Farming." className="font-display" />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/80 lg:mx-0">
            Upload your soil test report and get clear answers: what your soil
            needs, which crops suit it, and exactly how much fertilizer to use —
            in English or Telugu.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/soil-report"
              className={buttonVariants({
                size: "lg",
                className: "w-full bg-gold text-charcoal hover:bg-gold/90 sm:w-auto",
              })}
            >
              Analyze My Soil
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#how-it-works"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "w-full border-white/25 bg-white/5 text-ivory backdrop-blur hover:bg-white/15 hover:text-ivory sm:w-auto",
              })}
            >
              Explore How It Works
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:mx-0">
          <SampleInsightCard />
          <p className="mt-3 text-center text-xs text-ivory/50 lg:text-left">
            Sample preview — your report becomes the input.
          </p>
        </div>
      </div>

      <a
        href="#features"
        aria-label="Scroll to features"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 p-2.5 text-ivory/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-ivory"
      >
        <ChevronDown className="size-5 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
