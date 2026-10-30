"use client";

import { useState } from "react";
import { Sprout } from "lucide-react";
import { useStoredLang } from "@/lib/store";

export function Footer() {
  // `typeof window` guard: `new Date()` must never evaluate during prerender (Next 16).
  const [year] = useState(() =>
    typeof window === "undefined" ? 2026 : new Date().getFullYear()
  );
  const lang = useStoredLang();
  const te = lang === "te";

  return (
    <footer className="bg-forest text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-ivory text-forest">
                <Sprout className="size-5" aria-hidden />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">
                SasyaSakhi
              </span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/70">
              {te
                ? "మీ నేల. మా మద్దతు. మెరుగైన వ్యవసాయం. SasyaSakhi మీ నేల పరీక్ష నివేదికలను చదివి, స్పష్టమైన, ఆచరణాత్మక మార్గదర్శకత్వంగా మారుస్తుంది — తెలుగు మరియు ఇంగ్లీష్‌లో."
                : "Your soil. Our support. Better farming. SasyaSakhi reads your soil test reports and turns them into clear, practical guidance — in English and Telugu."}
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ivory/50">
              {te ? "అన్వేషించండి" : "Explore"}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#features" className="text-ivory/80 hover:text-ivory">
                  {te ? "ఫీచర్లు" : "Features"}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-ivory/80 hover:text-ivory">
                  {te ? "ఎలా పనిచేస్తుంది" : "How It Works"}
                </a>
              </li>
              <li>
                <a href="#crops" className="text-ivory/80 hover:text-ivory">
                  {te ? "పంటలు" : "Crops"}
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-ivory/80 hover:text-ivory">
                  {te ? "డెమో డాష్‌బోర్డ్ తెరవండి" : "Open the demo dashboard"}
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Contact">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ivory/50">
              {te ? "సంప్రదించండి" : "Contact"}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:hello@sasyasakhi.example"
                  className="text-ivory/80 hover:text-ivory"
                >
                  {te ? "బృందానికి ఈమెయిల్ చేయండి" : "Email the team"}
                </a>
              </li>
              <li>
                <a href="/assistant" className="text-ivory/80 hover:text-ivory">
                  {te ? "రైతు మద్దతు" : "Farmer support"}
                </a>
              </li>
              <li>
                <a href="#prototype-note" className="text-ivory/80 hover:text-ivory">
                  {te ? "గోప్యత (నమూనా గమనిక)" : "Privacy (prototype note)"}
                </a>
              </li>
              <li>
                <a href="#prototype-note" className="text-ivory/80 hover:text-ivory">
                  {te ? "నిబంధనలు (నమూనా గమనిక)" : "Terms (prototype note)"}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p
            id="prototype-note"
            className="text-xs leading-relaxed text-ivory/50"
          >
            {te
              ? "SasyaSakhi ఒక హ్యాకథాన్ నమూనా. సిఫార్సులు అందుబాటులో ఉన్న డేటాపై ఆధారపడి ఉంటాయి మరియు కేవలం సూచనలు మాత్రమే — ముఖ్యమైన నిర్ణయాలను మీ స్థానిక వ్యవసాయ అధికారితో నిర్ధారించుకోండి. గోప్యత మరియు నిబంధనల నోటీసులు మొదటి విడుదలతో ప్రచురించబడతాయి."
              : "SasyaSakhi is a hackathon prototype. Recommendations depend on the data available and are illustrative only — please confirm important decisions with your local agricultural officer. Privacy and Terms notices will be published with the first release."}
          </p>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 text-xs text-ivory/50 sm:flex-row sm:items-center">
            <p>© {year} SasyaSakhi. {te ? "అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి." : "All rights reserved."}</p>
            <p>{te ? "రైతుల కోసం నిర్మించబడింది, ఆంధ్రప్రదేశ్ నుండి ప్రారంభం." : "Built for farmers, starting in Andhra Pradesh."}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
