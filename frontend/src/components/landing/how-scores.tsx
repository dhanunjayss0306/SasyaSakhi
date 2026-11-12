"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoredLang } from "@/lib/store";

/** How the crop scores work — plain language, shown on the landing page.
 *  Two different tools, never mixed up:
 *  - Rules engine: sets fertilizer doses from the workbook (STCR rules).
 *  - ML score: compares your soil against each crop's ideal needs and
 *    returns one 0-100 score, so crops can be compared at a glance.
 *  The model never sets a dose and never guesses a missing value. */

const BASE_POINTS = [
  {
    title: { en: "The base: what each crop likes", te: "ఆధారం: ప్రతి పంటకు ఏమి ఇష్టం" },
    text: {
      en: "Every crop has ideal soil needs in the crop book — pH, organic carbon, and critical levels of N, P, K, sulphur, zinc, iron and boron. Those ideals are what the score is measured against.",
      te: "ప్రతి పంటకు పంట పుస్తకంలో ఆదర్శ నేల అవసరాలు ఉంటాయి — pH, సేంద్రీయ కార్బన్, N, P, K, సల్ఫర్, జింక్, ఇనుము, బోరాన్ క్లిష్ట స్థాయిలు. ఆ ఆదర్శాలే స్కోర్‌కు ఆధారం.",
    },
  },
  {
    title: { en: "How the score is made", te: "స్కోర్ ఎలా తయారవుతుంది" },
    text: {
      en: "We measure how far your soil is from those ideals — the gaps. A model trained on 800 crop-soil records turns the 10 gaps into one score, 0 to 100. No gaps scores about 94, never 100 — real fields always carry risk.",
      te: "మీ నేల ఆ ఆదర్శాలకు ఎంత దూరంలో ఉందో కొలుస్తాము — అంతరాలు. 800 పంట-నేల రికార్డులపై శిక్షణ పొందిన మోడల్ 10 అంతరాలను 0 నుండి 100 వరకు ఒక స్కోర్‌గా మారుస్తుంది. అంతరాలు లేని నేల 94 స్కోర్ చేస్తుంది, ఎప్పుడూ 100 కాదు — నిజమైన పొలాల్లో ఎల్లప్పుడూ కొంత ప్రమాదం ఉంటుంది.",
    },
  },
  {
    title: { en: "If pH is high, what changes?", te: "pH ఎక్కువగా ఉంటే ఏమి మారుతుంది?" },
    text: {
      en: "Example: your pH is 8.5, paddy's ideal top is 7.5 — the gap is 1.0, so the score drops. High pH also locks up iron, zinc and phosphorus, so the plant cannot use them. That is why the app tells you to fix pH, not just add fertilizer.",
      te: "ఉదాహరణ: మీ pH 8.5, వరికి ఆదర్శ గరిష్ఠం 7.5 — అంతరం 1.0, కాబట్టి స్కోర్ తగ్గుతుంది. ఎక్కువ pH ఇనుము, జింక్, భాస్వరాన్ని నేలలో బంధిస్తుంది, కాబట్టి మొక్క వాటిని వాడలేదు. అందుకే యాప్ ఎరువు వేయమని కాకుండా pH సరిచేయమని చెబుతుంది.",
    },
  },
  {
    title: { en: "Why use the model at all?", te: "మోడల్‌ను అసలు ఎందుకు వాడాలి?" },
    text: {
      en: "Rules give exact doses but no single comparison: is paddy better than cotton for this soil? The ML score weighs all 10 gaps together, so you can compare crops at a glance. Doses still come from the rules.",
      te: "నియమాలు ఖచ్చితమైన మోతాదులను ఇస్తాయి కానీ ఒకే పోలికను ఇవ్వవు: ఈ నేలకు వరి మంచిదా లేక పత్తి మంచిదా? ML స్కోర్ 10 అంతరాలను ఒకే చూపులో తూకం వేస్తుంది, కాబట్టి పంటలను త్వరగా పోల్చవచ్చు. మోతాదులు ఇప్పటికీ నియమాల నుండే వస్తాయి.",
    },
  },
  {
    title: { en: "What the model will not do", te: "మోడల్ ఏమి చేయదు" },
    text: {
      en: "If any of the 10 soil values is missing — boron is the usual one — the model refuses to score and names the missing value. It never fills a blank with zero or an average.",
      te: "10 నేల విలువలలో ఏదైనా తప్పిపోతే — బోరాన్ సాధారణంగా తప్పిపోతుంది — మోడల్ స్కోర్ చేయడానికి నిరాకరిస్తుంది మరియు ఏ విలువ తప్పిపోయిందో చెబుతుంది. ఇది ఎప్పుడూ ఖాళీని సున్నా లేదా సగటుతో నింపదు.",
    },
  },
];

export function HowScores() {
  const lang = useStoredLang();
  const te = lang === "te";
  return (
    <section
      id="how-scores"
      aria-labelledby="how-scores-heading"
      className="bg-cream py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-forest">
            {te ? "స్కోర్‌లు ఎలా పనిచేస్తాయి" : "How the scores work"}
          </p>
          <h2
            id="how-scores-heading"
            className="mt-3 font-display text-5xl font-semibold tracking-tight text-charcoal text-balance sm:text-6xl"
          >
            {te ? "ఒక స్కోర్, మరియు దాని వెనుక కారణాలు" : "One score, and the reasons behind it"}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/85">
            {te
              ? "రెండు సాధనాలు, పక్కపక్కనే. నియమాలు మీ ఎరువుల మోతాదులను నిర్ణయిస్తాయి. ML మోడల్ మీ నేలతో పంటలను స్కోర్ చేస్తుంది — ఎందుకో చూపిస్తుంది."
              : "Two tools, side by side. Rules set your fertilizer doses. The ML model scores crops against your soil — and shows why."}
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BASE_POINTS.map((point) => (
            <article
              key={point.title.en}
              className="rounded-2xl border border-sage bg-white p-6"
            >
              <h3 className="font-display text-xl font-semibold text-charcoal">
                {te ? point.title.te : point.title.en}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/85">
                {te ? point.text.te : point.text.en}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-12">
          <Link
            href="/recommendations"
            className={cn(
              buttonVariants({
                size: "lg",
                className: "bg-forest px-7 text-ivory hover:bg-pine",
              }),
            )}
          >
            {te ? "పంట సిఫార్సులు చూడండి" : "See crop recommendations"}
          </Link>
        </div>
      </div>
    </section>
  );
}
