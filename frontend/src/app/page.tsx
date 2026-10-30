"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HowScores } from "@/components/landing/how-scores";
import { CropShowcase } from "@/components/landing/crop-showcase";
import { TrustSection } from "@/components/landing/trust-section";
import { useStoredLang } from "@/lib/store";

function AboutSection() {
  const lang = useStoredLang();
  const te = lang === "te";
  return (
    <section id="about" aria-labelledby="about-heading" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest">
          {te ? "గురించి" : "About"}
        </p>
        <h2
          id="about-heading"
          className="mt-3 font-display text-4xl font-semibold tracking-tight text-charcoal text-balance sm:text-5xl"
        >
          {te
            ? "వ్యవసాయ నిర్ణయాలను అర్థం చేసుకోవడానికి ల్యాబ్ కోటు అవసరం లేదు"
            : "Farming decisions should not need a lab coat to understand"}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-charcoal/70">
          {te
            ? "SasyaSakhi ఒకే ఒక కారణం కోసం ఉంది: భారతదేశం అంతటా చిన్న రైతులకు పెద్ద వ్యవసాయ ల్యాబ్ ఇచ్చే స్పష్టతే వారి నేల గురించి కూడా లభించాలి. మీ వద్ద ఇప్పటికే ఉన్న నేల ఆరోగ్య కార్డును తీసుకుని, మీరు అమలు చేయగల మార్గదర్శకత్వంగా మారుస్తాము — ఏ పంట వేయాలి, ఎంత ఆహారం ఇవ్వాలి, మరియు ఎప్పుడు చేయాలి — ఇంగ్లీష్ లేదా తెలుగులో సరళంగా వివరించబడుతుంది."
            : "SasyaSakhi exists for one reason: smallholder farmers across India deserve the same clarity about their soil that a big agronomy lab provides. We take the soil health card you already have and turn it into guidance you can act on — which crop to sow, how much to feed it, and when to do it — explained simply in English or Telugu."}
        </p>
        <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
          {te
            ? "మేము ఆంధ్రప్రదేశ్‌లో వరి, పత్తి మరియు మిరపతో ప్రారంభిస్తున్నాము, మరియు నిజమైన రైతుల అభిప్రాయం నుండి పెరుగుతున్నాము."
            : "We are starting in Andhra Pradesh with paddy, cotton and chilli, and growing from real farmer feedback."}
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const lang = useStoredLang();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-5 focus:py-2.5 focus:text-ivory"
      >
        {lang === "te" ? "కంటెంట్‌కు వెళ్ళు" : "Skip to content"}
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <HowScores />
        <CropShowcase />
        <TrustSection />
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}
