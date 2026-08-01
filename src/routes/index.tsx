import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ServiceGrid, services } from "@/components/ServiceGrid";
import { TiltCard } from "@/components/TiltCard";
import { OnboardingTour } from "@/components/OnboardingTour";
import { LucidLoader } from "@/components/LucidLoader";
import { CaseStudy } from "@/components/CaseStudy";

const HeroScene = lazy(() => import("@/components/HeroScene"));

function HeroFallback() {
  return <div className="hero-stage" aria-hidden />;
}

/** Mounts the interactive 3D hero after hydration + first idle frame. */
function DeferredHeroScene() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setShow(true), { timeout: 1200 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(t);
  }, []);

  if (!show) return <HeroFallback />;
  return (
    <Suspense fallback={<HeroFallback />}>
      <HeroScene />
    </Suspense>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicPulse — Azure AI Hazard Triage | Season of AI 2.0" },
      {
        name: "description",
        content:
          "CivicPulse turns a resident's voice note and photo into a ranked, policy-backed city dispatch plan using Azure Speech, Vision, Language, AI Search and OpenAI.",
      },
      { property: "og:title", content: "CivicPulse — Azure AI Hazard Triage" },
      {
        property: "og:description",
        content:
          "A capstone mini product: five Azure AI services chained into one civic hazard triage pipeline, live and interactive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TICKER =
  "CIVICPULSE ONLINE · VOICE REPORT IN · VISION EVIDENCE · URGENCY SCORED · BYLAW CITED · DISPATCH PLAN OUT · 05 AZURE SERVICES · ";

function Index() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="rack">
        {/* ---- Header: identity + data plates ---- */}
        <header className="rack-bar flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">CivicPulse</h1>
            <span
              aria-hidden
              className="hidden h-5 w-px bg-slate-200 md:block"
            />
            <p className="text-xs font-medium text-slate-500">Season of AI 2.0 · Capstone Showcase</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="plate">05 AI Services</span>
            <span className="plate">01 Unified Pipeline</span>
            <span className="plate">Live System</span>
          </div>
        </header>

        {/* ---- Hero: problem statement + interactive 3D pipeline ---- */}
        <section
          aria-label="CivicPulse overview"
          className="grid grid-cols-1 border-t border-slate-200 bg-slate-50/50 lg:grid-cols-12"
        >
          <div className="p-6 md:p-10 lg:col-span-5 lg:border-r lg:border-slate-200">
            <p className="eyebrow">Overview</p>
            <p className="mt-3 font-display text-2xl font-bold leading-tight text-slate-900 md:text-3xl lg:text-4xl">
              A city hears every hazard.
              <br />
              And answers in seconds.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Residents report broken pipes, dark streets and flooded roads by voice and photo.
              CivicPulse listens, looks, scores the urgency, cites the bylaw and writes the dispatch
              plan — five Azure AI services acting as one operator.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="gold-cta" href="#case-study">
                See the pipeline
                <span aria-hidden className="arrow">
                  ↓
                </span>
              </a>
              <Link
                className="ghost-cta"
                to="/demo/$serviceId"
                params={{ serviceId: services[0]!.id }}
              >
                Run a live module
                <span aria-hidden className="arrow">
                  →
                </span>
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500 font-mono">
              Hover over or drag the 3D scene to steer the model
            </p>
          </div>
          <div className="p-4 md:p-8 lg:col-span-7">
            <DeferredHeroScene />
          </div>
        </section>

        {/* ---- Case study: the real-world pipeline ---- */}
        <CaseStudy />

        {/* ---- Module rack ---- */}
        <section
          id="services"
          className="scroll-mt-6 border-t border-slate-200 bg-white p-6 md:p-8"
          aria-label="Live modules"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Architecture</p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-900 md:text-3xl">Live Azure AI Modules</h2>
            </div>
            <p className="text-xs font-mono text-slate-500">
              {services.length} deployments · interactive card controls
            </p>
          </div>
          <div className="mt-4 h-px w-full bg-slate-100" />
          <div className="mt-6">
            <ServiceGrid />
          </div>
        </section>

        {/* ---- Rationale bento ---- */}
        <section className="border-t border-slate-200 bg-slate-50/60 p-6 md:p-8" aria-label="Why it qualifies">
          <p className="eyebrow">Key Highlights</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-4">
              <TiltCard className="tint-grey" intensity={4}>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">End-to-End Orchestration</p>
                <p className="mt-2 font-display text-lg font-semibold leading-tight text-slate-900 md:text-2xl">
                  Voice and image in, retrieval and reasoning in the middle, a dispatch plan out.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Every module is deployed independently, then chained into one civic workflow — so
                  the pipeline solves a real municipal problem instead of demoing an API.
                </p>
              </TiltCard>
            </div>
            <div className="md:col-span-2">
              <TiltCard className="tint-signal" intensity={5}>
                <p className="stat-figure">5</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Azure AI services chained into one unified pipeline.
                </p>
              </TiltCard>
            </div>
            <div className="md:col-span-3">
              <TiltCard className="tint-sand" intensity={5}>
                <p className="stat-figure">4h</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  SLA pulled straight from cited municipal bylaws.
                </p>
              </TiltCard>
            </div>
            <div className="md:col-span-3">
              <TiltCard className="tint-mint" intensity={5}>
                <p className="stat-figure">0</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  External redirects — full interactive execution inside showcase.
                </p>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* ---- Status footer ---- */}
        <footer className="overflow-hidden border-t border-slate-200 bg-slate-100 px-4 py-2.5">
          <div className="ticker text-slate-600" aria-hidden>
            {TICKER}
            {TICKER}
          </div>
          <p className="sr-only">
            CivicPulse — a Season of AI 2.0 capstone built with Azure OpenAI, AI Search, Speech,
            Vision and Language.
          </p>
        </footer>
      </div>

      <LucidLoader />
      <OnboardingTour />
    </main>
  );
}
