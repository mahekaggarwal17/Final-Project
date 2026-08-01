import { useState } from "react";
import { Link } from "@tanstack/react-router";

type Stage = {
  id: string;
  service: string;
  azure: string;
  serviceId: string;
  title: string;
  body: string;
  io: { in: string; out: string };
  tint: string;
};

/**
 * The real-world problem this capstone solves: a city gets thousands of messy
 * hazard reports (potholes, broken lights, flooding) and triages them by hand.
 * CivicPulse turns each report into a ranked, policy-backed dispatch plan.
 */
export const stages: Stage[] = [
  {
    id: "intake",
    service: "Speech",
    azure: "Azure AI Speech",
    serviceId: "speech",
    title: "A resident just speaks the problem",
    body: "No forms. A 12-second voice note in the street is transcribed live, so people who can't type or don't share the city's main language still get heard.",
    io: {
      in: "Voice note: “there's water gushing from the pipe outside 42 Marine Drive since morning”",
      out: "Transcript + language code + confidence 0.94",
    },
    tint: "card-skin",
  },
  {
    id: "evidence",
    service: "Vision",
    azure: "Azure AI Vision",
    serviceId: "vision",
    title: "The attached photo becomes evidence",
    body: "Vision reads the photo for objects, scene and any text on signage or meters — turning a blurry phone picture into structured facts a dispatcher can trust.",
    io: {
      in: "photo_4821.jpg (burst pipe, flooded footpath)",
      out: "tags: water, pipe, pavement, flooding · OCR: “WARD 6 / METER 118”",
    },
    tint: "card-mint",
  },
  {
    id: "triage",
    service: "Language",
    azure: "Azure AI Language",
    serviceId: "language",
    title: "Urgency is scored, not guessed",
    body: "Sentiment, key phrases and entities set the severity band and pull out the address, ward and asset ID — the fields that normally take a human ten minutes.",
    io: {
      in: "Transcript + vision tags",
      out: "severity: HIGH · category: water_leak · location: 42 Marine Dr · ward: 6",
    },
    tint: "card-lilac",
  },
  {
    id: "policy",
    service: "RAG Search",
    azure: "Azure AI Search",
    serviceId: "rag",
    title: "The rulebook answers, with citations",
    body: "Retrieval over municipal SOPs and bylaws finds the exact clause that governs this incident, so the response is defensible instead of improvised.",
    io: {
      in: "“water main leak response time ward 6”",
      out: "SOP-14 §3.2 — 4h response · Water Works Dept · escalate after 8h",
    },
    tint: "card-sand",
  },
  {
    id: "plan",
    service: "OpenAI",
    azure: "Azure OpenAI",
    serviceId: "openai",
    title: "One dispatch plan, ready to send",
    body: "The reasoning layer composes everything into a work order, a resident SMS in their own language, and a one-line summary for the ward dashboard.",
    io: {
      in: "Transcript + evidence + severity + SOP-14",
      out: "Work order WO-2261 · crew: Water Works · SLA 4h · resident SMS drafted",
    },
    tint: "card-grey",
  },
];

export function CaseStudy() {
  const [active, setActive] = useState(0);
  const stage = stages[active]!;

  return (
    <section
      id="case-study"
      aria-label="CivicPulse case study"
      className="scroll-mt-6 border-t border-slate-200 bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Pipeline Workflow</p>
          <h2 className="mt-1 font-display text-xl font-bold text-slate-900 md:text-3xl">
            City hazard reports, triaged in seconds
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            City call centres drown in unstructured complaints: voice notes, photos and half-typed
            addresses. Crews are dispatched late, and residents never hear back. CivicPulse chains
            five Azure AI services into one pipeline that listens, sees, scores, checks the rulebook
            and writes the dispatch plan.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {[
            { k: "12s", v: "voice note in" },
            { k: "5", v: "AI services chained" },
            { k: "1", v: "dispatch plan out" },
          ].map((s) => (
            <div key={s.v} className="glass-panel p-3 text-center">
              <dt className="stat-figure text-2xl font-bold text-slate-900 md:text-3xl">{s.k}</dt>
              <dd className="mt-1 text-xs font-medium text-slate-500">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* stage picker */}
      <ol className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Pipeline stages">
        {stages.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              role="tab"
              id={`stage-tab-${s.id}`}
              aria-selected={i === active}
              aria-controls={`stage-panel-${s.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setActive((i + 1) % stages.length);
                if (e.key === "ArrowLeft") setActive((i - 1 + stages.length) % stages.length);
              }}
              className={`stage-chip ${i === active ? "stage-chip-active" : ""}`}
            >
              <span className="font-mono text-xs font-semibold">{String(i + 1).padStart(2, "0")}</span>
              <span>{s.service}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* active stage */}
      <div
        key={stage.id}
        role="tabpanel"
        id={`stage-panel-${stage.id}`}
        aria-labelledby={`stage-tab-${stage.id}`}
        className={`stage-panel mt-5 grid grid-cols-1 gap-5 p-6 lg:grid-cols-12 ${stage.tint}`}
      >
        <div className="lg:col-span-7">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600">
            Stage {String(active + 1).padStart(2, "0")} · {stage.azure}
          </p>
          <p className="mt-2 font-display text-lg font-bold leading-tight text-slate-900 md:text-2xl">{stage.title}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            {stage.body}
          </p>
          <Link
            className="ghost-cta mt-5"
            to="/demo/$serviceId"
            params={{ serviceId: stage.serviceId }}
          >
            Run this stage live
            <span aria-hidden className="arrow">
              →
            </span>
          </Link>
        </div>
        <div className="grid gap-3 lg:col-span-5">
          <div className="glass-panel p-4">
            <p className="text-xs font-mono font-semibold text-slate-500 uppercase">Input</p>
            <p className="mt-2 font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-100">{stage.io.in}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs font-mono font-semibold text-slate-500 uppercase">Output</p>
            <p className="mt-2 font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-100">{stage.io.out}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CaseStudy;
