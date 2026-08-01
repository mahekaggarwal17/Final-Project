import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

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
 * Azure AI Suite 5-Service Chained Pipeline Workflow
 */
export const stages: Stage[] = [
  {
    id: "intake",
    service: "Speech AI",
    azure: "Azure AI Speech",
    serviceId: "speech",
    title: "Voice Report Ingestion & Live Transcription",
    body: "Ingests microphone audio in real-time, transcribes spoken words continuously, and computes live hypothesis streams with multi-language support.",
    io: {
      in: "Microphone Audio: “there's a water main leak outside Sector 4 near Valve 118”",
      out: "Finalized Transcript + lang: en-US + confidence: 0.98",
    },
    tint: "card-skin",
  },
  {
    id: "evidence",
    service: "Computer Vision OCR",
    azure: "Azure AI Vision",
    serviceId: "vision",
    title: "Visual Scene & Meter OCR Extraction",
    body: "Reads scene tags, detects hazard features, and extracts text on meter plates and signage via OCR, transforming photos into verified telemetry.",
    io: {
      in: "photo_meter_118.jpg (flooded street, water valve)",
      out: "tags: water_valve, flooding · OCR: “SECTOR 4 / VALVE 118”",
    },
    tint: "card-mint",
  },
  {
    id: "triage",
    service: "Cognitive Language",
    azure: "Azure AI Language",
    serviceId: "language",
    title: "Urgency Scoring & Entity Extraction",
    body: "Sentiment, key phrase mining, and named entity recognition automatically classify severity levels and extract addresses and ward numbers.",
    io: {
      in: "Transcript + Vision OCR payload",
      out: "severity: HIGH · category: water_leak · location: Sector 4 Valve 118",
    },
    tint: "card-lilac",
  },
  {
    id: "policy",
    service: "Bylaw RAG Search",
    azure: "Azure AI Search",
    serviceId: "rag",
    title: "Rulebook & Bylaw Policy Retrieval",
    body: "Hybrid vector search queries municipal SOP documents and bylaws to retrieve official response procedures and legally mandated SLAs.",
    io: {
      in: "Query: “water main leak response window ward 6”",
      out: "SOP-14 §3.2 — 4h response window · Water Works Escalation",
    },
    tint: "card-sand",
  },
  {
    id: "plan",
    service: "Neural Synthesis & Dispatch",
    azure: "Azure OpenAI & TTS",
    serviceId: "openai",
    title: "Dispatch Generation & Neural Voice Output",
    body: "Synthesizes structured work orders and generates lifelike neural text-to-speech audio updates for field crews and public dashboards.",
    io: {
      in: "Transcript + Vision Evidence + Bylaw SOP-14",
      out: "WorkOrder WO-4821 · Crew: Rapid Water Repair · Voice Audio Synthesized",
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
      aria-label="Speech AI case study"
      className="scroll-mt-6 border-t-[3px] border-[#1c293c] bg-[#ffffff] p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Audio Pipeline Architecture</span>
          <h2 className="mt-2 font-display text-2xl font-black text-[#1c293c] md:text-3xl">
            Real-Time Speech & Telemetry Processing
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#334155]">
            Continuous speech recognition streams live microphone audio, extracts visual scene evidence, scores incident severity, checks regulatory bylaws via RAG, and synthesizes neural voice output.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {[
            { k: "12s", v: "audio ingestion" },
            { k: "5", v: "Azure AI engines" },
            { k: "1", v: "synthesized response" },
          ].map((s) => (
            <div key={s.v} className="glass-panel p-3 text-center border-[3px] border-[#1c293c] bg-[#f4f0e6] shadow-[2px_2px_0px_0px_#1c293c]">
              <dt className="stat-figure text-2xl font-black text-[#1c293c] md:text-3xl">{s.k}</dt>
              <dd className="mt-1 text-xs font-bold text-[#1c293c] uppercase">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* stage picker tabs */}
      <ol className="mt-6 flex flex-wrap gap-2.5" role="tablist" aria-label="Pipeline stages">
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
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition-all border-[3px] border-[#1c293c] ${
                i === active
                  ? "bg-[#fdc800] text-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c] -translate-x-0.5 -translate-y-0.5"
                  : "bg-white text-[#1c293c] hover:bg-[#f4f0e6] shadow-[2px_2px_0px_0px_#1c293c]"
              }`}
            >
              <span className="font-mono text-xs font-black">{String(i + 1).padStart(2, "0")}</span>
              <span>{s.service}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* active stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          role="tabpanel"
          id={`stage-panel-${stage.id}`}
          aria-labelledby={`stage-tab-${stage.id}`}
          className={`stage-panel mt-6 grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 rounded-xl border-[3px] border-[#1c293c] shadow-[6px_6px_0px_0px_#1c293c] ${stage.tint}`}
        >
          <div className="lg:col-span-7">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-[#1c293c] bg-white border-[2px] border-[#1c293c] px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#1c293c] inline-block">
              Stage {String(active + 1).padStart(2, "0")} · {stage.azure}
            </span>
            <h3 className="mt-3 font-display text-xl font-black leading-tight text-[#1c293c] md:text-2xl">{stage.title}</h3>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-[#334155]">
              {stage.body}
            </p>
            <Link
              className="gold-cta mt-6"
              to="/demo/$serviceId"
              params={{ serviceId: stage.serviceId }}
            >
              <span>Execute Stage Live</span>
              <span aria-hidden className="arrow">→</span>
            </Link>
          </div>
          <div className="grid gap-3 lg:col-span-5">
            <div className="glass-panel p-4 border-[3px] border-[#1c293c] bg-white shadow-[3px_3px_0px_0px_#1c293c]">
              <p className="text-xs font-mono font-extrabold text-[#1c293c] uppercase">Input Payload</p>
              <p className="mt-2 font-mono text-xs text-[#1c293c] leading-relaxed bg-[#f4f0e6] p-3 rounded-md border-[2px] border-[#1c293c]">{stage.io.in}</p>
            </div>
            <div className="glass-panel p-4 border-[3px] border-[#1c293c] bg-white shadow-[3px_3px_0px_0px_#1c293c]">
              <p className="text-xs font-mono font-extrabold text-[#1c293c] uppercase">Output Telemetry</p>
              <p className="mt-2 font-mono text-xs text-[#1c293c] leading-relaxed bg-[#f4f0e6] p-3 rounded-md border-[2px] border-[#1c293c]">{stage.io.out}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default CaseStudy;
