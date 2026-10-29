const STEPS = [
  {
    title: "Upload",
    description:
      "Take a photo of your soil health card or upload the PDF from the lab.",
  },
  {
    title: "Extract",
    description:
      "OCR reads pH, EC, organic carbon, N, P, K and micronutrients automatically.",
  },
  {
    title: "Review",
    description:
      "You confirm the extracted values — nothing moves forward without your yes.",
  },
  {
    title: "Analyze",
    description:
      "The rules engine scores your soil health and flags deficiencies.",
  },
  {
    title: "Crop suitability",
    description:
      "Paddy, cotton and chilli are matched against your soil with clear scores.",
  },
  {
    title: "Nutrients",
    description:
      "Fertilizer doses per acre with estimated costs, crop by crop.",
  },
  {
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
      className="bg-[#EAF0E4] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-forest">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
          >
            Seven steps from soil sample to confident sowing
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            A guided flow that keeps you in control — the machine reads, the
            rules calculate, and you approve every step.
          </p>
        </div>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-3xl border border-charcoal/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-ivory">
                {i + 1}
              </span>
              <h3 className="mt-4 font-sans text-base font-bold text-charcoal">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-charcoal/60">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
