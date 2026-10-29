/** How the crop scores work — plain language, shown on the landing page.
 *  Two different tools, never mixed up:
 *  - Rules engine: sets fertilizer doses from the workbook (STCR rules).
 *  - ML score: compares your soil against each crop's ideal needs and
 *    returns one 0-100 score, so crops can be compared at a glance.
 *  The model never sets a dose and never guesses a missing value. */

const BASE_POINTS = [
  {
    title: "The base: what each crop likes",
    text: "Every crop has ideal soil needs written in the crop book: paddy likes pH 5.5-7.5, a minimum organic carbon, and critical levels of nitrogen, phosphorus, potassium, sulphur, zinc, iron and boron. Those ideals are the base the score is measured against.",
  },
  {
    title: "How the score is made",
    text: "We measure how far your soil is from those ideals — the gaps. A model trained on 800 crop-soil records turns the 10 gaps into one score from 0 to 100. A soil with no gaps scores about 94, never 100, because real fields always carry some risk.",
  },
  {
    title: "If pH is high, what changes?",
    text: "Example: your pH is 8.5 but paddy's ideal top is 7.5, so the pH gap is 1.0 and the paddy score drops. High pH also locks up iron, zinc and phosphorus in the soil, so the plant cannot use them even when they are present. That is why pH matters most in the score — and why the app tells you to fix pH, not just add fertilizer.",
  },
  {
    title: "Why use the model at all?",
    text: "Rules alone give exact doses but no single comparison: is paddy better than cotton for this soil? The ML score weighs all 10 gaps together at a glance, so you can compare crops quickly. Doses still come from the rules, so nothing the model says can invent a fertilizer quantity.",
  },
  {
    title: "What the model will not do",
    text: "If any of the 10 soil values is missing — boron is the usual one — the model refuses to score and tells you exactly which value is missing. It never fills a blank with zero or an average.",
  },
];

export function HowScores() {
  return (
    <section
      id="how-scores"
      aria-labelledby="how-scores-heading"
      className="bg-ivory py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-leaf">
            How the scores work
          </p>
          <h2
            id="how-scores-heading"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
          >
            One score, and the reasons behind it
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            The app uses two tools side by side. Rules set your fertilizer
            doses. The ML model only scores crops against your soil — and
            always shows why.
          </p>
        </div>
        <div className="mt-12 grid gap-5">
          {BASE_POINTS.map((point) => (
            <article
              key={point.title}
              className="rounded-2xl border border-sage bg-white p-6"
            >
              <h3 className="font-display text-xl font-semibold text-charcoal">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                {point.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
