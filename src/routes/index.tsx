import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      { title: "Azure AI Suite · Multimodal Intelligence Hub | Season of AI" },
      {
        name: "description",
        content:
          "Unified Azure AI Suite integrating Speech, Vision, Language, Vector Search RAG, and OpenAI into a real-time multimodal intelligence pipeline.",
      },
      { property: "og:title", content: "Azure AI Suite · Multimodal Intelligence Hub" },
      {
        property: "og:description",
        content:
          "Complete Azure AI Workspace: five microservices (Speech, Vision, Language, AI Search RAG, OpenAI) chained into one unified pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TICKER =
  "AZURE AI SUITE ONLINE · SPEECH RECOGNITION & SYNTHESIS · COMPUTER VISION OCR · LANGUAGE ENTITY EXTRACTION · VECTOR INDEX RAG · AZURE OPENAI REASONING · ";

function Index() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="rack border-[3px] border-[#1c293c] bg-white shadow-[6px_6px_0px_0px_#1c293c] rounded-2xl overflow-hidden">
        
        {/* ── Navigation Bar (Neo-Brutalism Developer Design System) ────────────────── */}
        <header className="rack-bar flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between border-b-[3px] border-[#1c293c] bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#fdc800] border-[3px] border-[#1c293c] rounded-lg shadow-[2px_2px_0px_0px_#1c293c] font-extrabold text-[#1c293c]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1c293c] md:text-3xl">
              Azure<span className="text-[#fdc800] underline decoration-[#1c293c] decoration-4"> AI</span> Suite
            </h1>
            <span aria-hidden className="hidden h-6 w-[3px] bg-[#1c293c] md:block" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#334155]">
              Multimodal Intelligence Hub
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d1fae5] border-[2px] border-[#1c293c] text-xs font-extrabold text-[#1c293c] shadow-[2px_2px_0px_0px_#1c293c]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] border border-[#1c293c] animate-pulse" />
              <span>05 Azure Services Online</span>
            </div>
            <span className="plate bg-[#fdc800]">01 Unified Pipeline</span>
            <span className="plate bg-[#f3e8ff]">Live System</span>
          </div>
        </header>

        {/* ── Main Workspace Header / Hero Section ─────────────────────────── */}
        <section
          aria-label="Azure AI Suite overview"
          className="grid grid-cols-1 border-b-[3px] border-[#1c293c] bg-[#f4f0e6]/60 lg:grid-cols-12"
        >
          <div className="p-6 md:p-10 lg:col-span-6 lg:border-r-[3px] lg:border-[#1c293c]">
            <span className="eyebrow">Multimodal AI Platform</span>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight text-[#1c293c] md:text-4xl lg:text-5xl">
              Speech, Vision, Language, Vector RAG & OpenAI.
            </h2>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[#334155]">
              A complete multi-service workspace powered by Microsoft Azure. Ingest live voice streams, process computer vision OCR evidence, score report urgency with NLP, query vector index bylaws, and generate automated dispatch plans via GPT reasoning.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="gold-cta" href="#workspace">
                <span>Explore All 5 Modules</span>
                <span aria-hidden className="arrow">↓</span>
              </a>
              <Link
                className="ghost-cta"
                to="/demo/$serviceId"
                params={{ serviceId: services[0]!.id }}
              >
                <span>Launch Interactive Demo</span>
                <span aria-hidden className="arrow">→</span>
              </Link>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white border-[2px] border-[#1c293c] p-2.5 shadow-[2px_2px_0px_0px_#1c293c] text-xs font-mono font-bold text-[#1c293c]">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span>Interactive 3D Pipeline: Hover or drag to steer the neural network nodes</span>
            </div>
          </div>
          <div className="p-4 md:p-8 lg:col-span-6 flex items-center justify-center bg-white">
            <DeferredHeroScene />
          </div>
        </section>

        {/* ── Case Study / Pipeline Workflow ───────────────────────────────── */}
        <CaseStudy />

        {/* ── Module Rack (Bento Grid Workspace) ──────────────────────────── */}
        <section
          id="workspace"
          className="scroll-mt-6 border-t-[3px] border-[#1c293c] bg-[#ffffff] p-6 md:p-8"
          aria-label="Live Azure AI Microservices workspace"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">Azure Cognitive Infrastructure</span>
              <h2 className="mt-2 font-display text-2xl font-black text-[#1c293c] md:text-3xl">
                Integrated Azure AI Microservices
              </h2>
            </div>
            <p className="text-xs font-mono font-extrabold text-[#1c293c]">
              {services.length} active deployments · interactive console cards
            </p>
          </div>
          <div className="mt-4 h-[3px] w-full bg-[#1c293c]" />
          <div className="mt-6">
            <ServiceGrid />
          </div>
        </section>

        {/* ── Architectural Highlights (Neo-Brutalist Bento) ────────────────── */}
        <section className="border-t-[3px] border-[#1c293c] bg-[#f4f0e6]/80 p-6 md:p-8" aria-label="Key highlights">
          <span className="eyebrow">Architecture Highlights</span>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-6">
            <div className="md:col-span-4">
              <TiltCard className="tint-grey border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c]">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#1c293c] bg-[#fdc800] inline-block px-2 py-0.5 border border-[#1c293c] rounded">
                  Multimodal End-to-End Orchestration
                </p>
                <h3 className="mt-3 font-display text-xl font-extrabold leading-tight text-[#1c293c] md:text-2xl">
                  Voice & Image In. Retrieval & Reasoning in the Center. Action Out.
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-[#334155]">
                  Each module is deployed independently on Azure cloud microservices, then chained into one unified civic workflow — solving complex municipal hazard triage with high-confidence AI.
                </p>
              </TiltCard>
            </div>
            <div className="md:col-span-2">
              <TiltCard className="tint-signal border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c]">
                <p className="stat-figure">5</p>
                <p className="mt-2 text-sm font-bold text-[#1c293c]">
                  Azure AI Services integrated into one unified pipeline.
                </p>
              </TiltCard>
            </div>
            <div className="md:col-span-3">
              <TiltCard className="tint-sand border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c]">
                <p className="stat-figure">&lt; 4h</p>
                <p className="mt-2 text-sm font-bold text-[#1c293c]">
                  Target SLA synthesized directly from municipal bylaws via Vector RAG.
                </p>
              </TiltCard>
            </div>
            <div className="md:col-span-3">
              <TiltCard className="tint-mint border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c]">
                <p className="stat-figure">0ms</p>
                <p className="mt-2 text-sm font-bold text-[#1c293c]">
                  Zero external redirects — full interactive execution inside the showcase.
                </p>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* ── Status Ticker Footer ─────────────────────────────────────────── */}
        <footer className="overflow-hidden border-t-[3px] border-[#1c293c] bg-[#fdc800] px-4 py-3">
          <div className="ticker text-[#1c293c]" aria-hidden>
            {TICKER}
            {TICKER}
          </div>
          <p className="sr-only">
            Azure AI Suite — Built with Microsoft Azure Cognitive Services Speech, Vision, Language, AI Search, and OpenAI.
          </p>
        </footer>
      </div>

      <LucidLoader />
      <OnboardingTour />
    </main>
  );
}
