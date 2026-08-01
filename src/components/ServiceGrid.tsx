import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { TiltCard } from "./TiltCard";

const CARD_TINTS = ["tint-sand", "tint-mint", "tint-lilac", "tint-skin", "tint-grey"] as const;
import { ServiceDialog } from "./ServiceDialog";
import { ServiceFilterBar, matchesService } from "./ServiceFilterBar";
import { useServiceWarmup } from "@/hooks/use-service-warmup";

export type ServiceExample = {
  label: string;
  input: string;
  output: string;
  payload: Record<string, unknown>;
  /** Expected JSON response shape for this example. */
  response: Record<string, unknown>;
};

export type Service = {
  id: string;
  name: string;
  azure: string;
  url: string;
  endpoint: string;
  blurb: string;
  glyph: string;
  capabilities: string[];
  detail: string;
  pipeline: string[];
  examples: ServiceExample[];
};

export const services: Service[] = [
  {
    id: "openai",
    name: "Conversational Studio",
    azure: "Azure OpenAI",
    url: "https://azure-openai-kujc.onrender.com/",
    endpoint: "https://azure-openai-kujc.onrender.com/api/chat",
    blurb:
      "GPT-powered reasoning and chat completions with prompt controls, streaming answers and context handling.",
    glyph: "01",
    capabilities: ["Chat completions", "Prompt design", "Streaming"],
    detail:
      "The reasoning layer of the product. A chat deployment on Azure OpenAI takes the user question plus any context gathered by the other modules and writes the final answer. System prompts, temperature and conversation history are all controlled from the demo UI.",
    pipeline: [
      "User message plus prior turns are sent as a messages array",
      "A system prompt sets the persona and answer format",
      "The chat completion streams tokens back to the browser",
    ],
    examples: [
      {
        label: "Explain with constraints",
        input: "Explain retrieval-augmented generation to a first-year student in 3 bullets.",
        output:
          "• The model searches your documents first.\n• The best passages are pasted into the prompt.\n• The answer is written only from those passages, so it can cite them.",
        payload: {
          messages: [
            { role: "system", content: "You are a concise teaching assistant. Answer in bullets." },
            {
              role: "user",
              content:
                "Explain retrieval-augmented generation to a first-year student in 3 bullets.",
            },
          ],
          temperature: 0.3,
          max_tokens: 300,
          stream: false,
        },
        response: {
          id: "chatcmpl-9x1a2b",
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content:
                  "• The model searches your documents first.\n• The best passages are pasted into the prompt.\n• The answer is written only from those passages, so it can cite them.",
              },
            },
          ],
          usage: { prompt_tokens: 48, completion_tokens: 61, total_tokens: 109 },
        },
      },
      {
        label: "Rewrite",
        input: "Rewrite this as a polite reminder: send the report today.",
        output:
          "Just a gentle reminder that the report is due today — could you share it when you get a moment? Thank you!",
        payload: {
          messages: [
            { role: "system", content: "Rewrite the user text in a warm, professional tone." },
            { role: "user", content: "Rewrite this as a polite reminder: send the report today." },
          ],
          temperature: 0.7,
        },
        response: {
          id: "chatcmpl-9x1a7f",
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content:
                  "Just a gentle reminder that the report is due today — could you share it when you get a moment? Thank you!",
              },
            },
          ],
          usage: { prompt_tokens: 34, completion_tokens: 27, total_tokens: 61 },
        },
      },
    ],
  },
  {
    id: "rag",
    name: "Knowledge Retrieval",
    azure: "Azure AI Search + RAG",
    url: "https://azure-ai-search-open-ai.onrender.com/",
    endpoint: "https://azure-ai-search-open-ai.onrender.com/api/query",
    blurb:
      "Grounded answers over your own documents using vector indexing and retrieval-augmented generation.",
    glyph: "02",
    capabilities: ["Vector index", "Grounded answers", "Citations"],
    detail:
      "Documents are chunked, embedded and stored in an Azure AI Search index. At query time the closest chunks are retrieved and handed to the model, so answers stay grounded in your own content instead of the model's memory.",
    pipeline: [
      "Upload a document — it is split into overlapping chunks",
      "Each chunk is embedded and written to the vector index",
      "A question retrieves the top matches, which become the answer context",
    ],
    examples: [
      {
        label: "Policy lookup",
        input: "How many casual leaves does the handbook allow per year?",
        output:
          "12 casual leaves per calendar year, with a maximum of 3 taken consecutively.\nSource: employee-handbook.pdf — chunk 14 (score 0.87)",
        payload: {
          question: "How many casual leaves does the handbook allow per year?",
          index: "employee-handbook",
          top_k: 4,
          min_score: 0.75,
          include_citations: true,
        },
        response: {
          answer: "12 casual leaves per calendar year, with a maximum of 3 taken consecutively.",
          citations: [
            {
              document: "employee-handbook.pdf",
              chunk: 14,
              score: 0.87,
              excerpt: "Employees are entitled to 12 casual leaves per calendar year…",
            },
          ],
          retrieved: 4,
          grounded: true,
        },
      },
      {
        label: "Out-of-scope question",
        input: "What is the CEO's home address?",
        output:
          "I could not find that in the indexed documents. Nothing was returned above the relevance threshold.",
        payload: {
          question: "What is the CEO's home address?",
          index: "employee-handbook",
          top_k: 4,
          min_score: 0.75,
        },
        response: {
          answer: "I could not find that in the indexed documents.",
          citations: [],
          retrieved: 0,
          grounded: false,
          reason: "no_chunk_above_threshold",
        },
      },
    ],
  },
  {
    id: "speech",
    name: "Voice Interface",
    azure: "Azure AI Speech",
    url: "https://speech-ai48.onrender.com/",
    endpoint: "https://speech-ai48.onrender.com/api/speech",
    blurb:
      "Speech-to-text transcription and neural text-to-speech for fully hands-free interaction.",
    glyph: "03",
    capabilities: ["Transcription", "Neural TTS", "Multi-locale"],
    detail:
      "The hands-free entry and exit point. Speech-to-text turns microphone audio or an uploaded clip into text for the rest of the pipeline, and neural text-to-speech reads the final answer back in a natural voice across multiple locales.",
    pipeline: [
      "Record or upload audio in the browser",
      "Speech-to-text returns the transcript with a confidence score",
      "Any answer text can be synthesised back as neural speech",
    ],
    examples: [
      {
        label: "Speech to text",
        input: "🎙️ 6s clip: “What were last quarter's support ticket trends?”",
        output:
          'Transcript: "What were last quarter\'s support ticket trends?"\nConfidence 0.94 · Locale en-IN · Duration 6.1s',
        payload: {
          mode: "speech-to-text",
          locale: "en-IN",
          audio_url: "https://example.com/clips/question.wav",
          format: "wav",
        },
        response: {
          mode: "speech-to-text",
          transcript: "What were last quarter's support ticket trends?",
          confidence: 0.94,
          locale: "en-IN",
          duration_seconds: 6.1,
        },
      },
      {
        label: "Text to speech",
        input: "Read aloud: “Your report is ready.” · voice en-US-JennyNeural",
        output: "audio/wav returned (1.4s) and played in the browser player.",
        payload: {
          mode: "text-to-speech",
          text: "Your report is ready.",
          voice: "en-US-JennyNeural",
          format: "audio-16khz-32kbitrate-mono-mp3",
        },
        response: {
          mode: "text-to-speech",
          voice: "en-US-JennyNeural",
          content_type: "audio/mpeg",
          duration_seconds: 1.4,
          audio_url: "https://example.com/tts/report-ready.mp3",
        },
      },
    ],
  },
  {
    id: "vision",
    name: "Visual Intelligence",
    azure: "Azure AI Vision",
    url: "https://azure-vision.netlify.app/",
    endpoint: "https://azure-vision.netlify.app/api/analyze",
    blurb:
      "Image understanding with captioning, tagging, OCR text extraction and object detection.",
    glyph: "04",
    capabilities: ["Captioning", "OCR", "Object tags"],
    detail:
      "Turns an image into text the rest of the product can reason over. One upload returns a natural-language caption, ranked tags, detected objects with bounding boxes, and any readable text via OCR.",
    pipeline: [
      "Upload or link an image",
      "Vision analysis returns caption, tags and object boxes",
      "OCR extracts printed or handwritten text for downstream use",
    ],
    examples: [
      {
        label: "Caption and tags",
        input: "🖼️ Photo of a whiteboard in a meeting room",
        output:
          'Caption: "a whiteboard with diagrams in an office" (0.82)\nTags: whiteboard 0.99 · indoor 0.97 · text 0.93 · office 0.90',
        payload: {
          image_url: "https://example.com/images/whiteboard.jpg",
          features: ["caption", "tags", "objects"],
          language: "en",
        },
        response: {
          caption: { text: "a whiteboard with diagrams in an office", confidence: 0.82 },
          tags: [
            { name: "whiteboard", confidence: 0.99 },
            { name: "indoor", confidence: 0.97 },
            { name: "text", confidence: 0.93 },
            { name: "office", confidence: 0.9 },
          ],
          objects: [{ name: "whiteboard", confidence: 0.88, box: [42, 60, 780, 520] }],
        },
      },
      {
        label: "OCR receipt",
        input: "🖼️ Photo of a printed receipt",
        output: "Lines: TOTAL 1,240.00 · GST 18% · INVOICE #A-2291 · 14 lines read, avg conf 0.96",
        payload: {
          image_url: "https://example.com/images/receipt.jpg",
          features: ["read"],
          language: "en",
        },
        response: {
          read: {
            line_count: 14,
            average_confidence: 0.96,
            lines: [
              { text: "INVOICE #A-2291", confidence: 0.98 },
              { text: "GST 18%", confidence: 0.95 },
              { text: "TOTAL 1,240.00", confidence: 0.97 },
            ],
          },
        },
      },
    ],
  },
  {
    id: "language",
    name: "Language Analytics",
    azure: "Azure AI Language",
    url: "https://azure-language.netlify.app/",
    endpoint: "https://azure-language.netlify.app/api/analyze",
    blurb:
      "Sentiment, key phrases, entity recognition and summarisation across free-form text input.",
    glyph: "05",
    capabilities: ["Sentiment", "Entities", "Summaries"],
    detail:
      "The analytics layer over any text in the system — typed, transcribed or extracted from an image. It scores sentiment, pulls out key phrases and named entities, detects language, and produces extractive summaries.",
    pipeline: [
      "Paste text, or pass in a transcript or OCR result",
      "Language detection and sentiment scoring run per sentence",
      "Key phrases, entities and a short summary are returned",
    ],
    examples: [
      {
        label: "Sentiment and entities",
        input: "The delivery from Mumbai arrived two days late, but support was excellent.",
        output:
          "Sentiment: mixed (pos 0.51 · neg 0.44)\nEntities: Mumbai (Location) · two days (DateTime)\nKey phrases: delivery, support",
        payload: {
          text: "The delivery from Mumbai arrived two days late, but support was excellent.",
          tasks: ["sentiment", "entities", "keyPhrases", "languageDetection"],
          opinion_mining: true,
        },
        response: {
          language: { iso: "en", confidence: 0.99 },
          sentiment: { label: "mixed", scores: { positive: 0.51, neutral: 0.05, negative: 0.44 } },
          entities: [
            { text: "Mumbai", category: "Location", confidence: 0.97 },
            { text: "two days", category: "DateTime", confidence: 0.91 },
          ],
          key_phrases: ["delivery", "support"],
        },
      },
      {
        label: "Summarise",
        input: "Summarise a 900-word support thread",
        output:
          "Customer could not log in after a password reset; agent cleared the cached token and access was restored. Follow-up: document the fix.",
        payload: {
          text: "<paste the 900-word support thread here>",
          tasks: ["extractiveSummarization"],
          sentence_count: 2,
        },
        response: {
          summary:
            "Customer could not log in after a password reset; agent cleared the cached token and access was restored. Follow-up: document the fix.",
          sentences: [
            { text: "Customer could not log in after a password reset.", rank: 0.91 },
            { text: "Agent cleared the cached token and access was restored.", rank: 0.87 },
          ],
        },
      },
    ],
  },
];

export function ServiceGrid() {
  const [active, setActive] = useState<Service | null>(null);
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { warmProps } = useServiceWarmup();

  const visible = useMemo(
    () => services.filter((s) => matchesService(s, query, cats)),
    [query, cats],
  );

  const closeDialog = () => {
    setActive(null);
    // Return focus to the card that opened the dialog.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <ServiceFilterBar
        query={query}
        onQueryChange={setQuery}
        active={cats}
        onToggle={(id) =>
          setCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
        }
        onReset={() => {
          setQuery("");
          setCats([]);
        }}
        resultCount={visible.length}
      />

      <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <TiltCard
                className={`${CARD_TINTS[idx % CARD_TINTS.length] ?? ""} border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c] bg-white rounded-xl`}
                hint="Drag to tilt"
                {...warmProps(s.id, s.url)}
                {...(idx === 0 ? { "data-tour": "card" } : {})}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setActive(s);
                  }}
                  aria-label={`View details and example requests for ${s.name}`}
                  aria-haspopup="dialog"
                  className="focus-inset absolute inset-0 z-10 cursor-pointer rounded-[inherit]"
                />

                <span
                  className="glyph text-[#1c293c] font-mono font-black text-3xl opacity-20"
                  aria-hidden
                >
                  {s.glyph}
                </span>
                <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#1c293c] bg-[#fdc800] border-[2px] border-[#1c293c] px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#1c293c] inline-block self-start">
                  {s.azure}
                </span>
                <h3 className="mt-3 text-xl font-black leading-tight text-[#1c293c] font-display">
                  {s.name}
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#334155]">{s.blurb}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {s.capabilities.map((c) => (
                    <li
                      key={c}
                      className="chip bg-white border-[2px] border-[#1c293c] font-mono font-bold text-xs text-[#1c293c]"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="relative z-20 mt-6 flex flex-wrap items-center gap-3">
                  <span
                    className="link-cta pointer-events-none"
                    {...(idx === 0 ? { "data-tour": "details" } : {})}
                  >
                    Inspect Engine
                    <span aria-hidden className="arrow">
                      →
                    </span>
                  </span>
                  <Link
                    to="/demo/$serviceId"
                    params={{ serviceId: s.id }}
                    preload="intent"
                    className="text-xs font-extrabold text-[#1c293c] hover:underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    {...(idx === 0 ? { "data-tour": "open-module" } : {})}
                  >
                    Run Demo
                  </Link>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === services.length && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: services.length * 0.04 }}
          >
            <TiltCard className="tint-grey border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c] bg-white rounded-xl">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#1c293c] bg-[#38bdf8] border-[2px] border-[#1c293c] px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#1c293c] inline-block self-start">
                System Orchestration
              </span>
              <h3 className="mt-3 text-xl font-black leading-tight text-[#1c293c] font-display">
                05 Microservices. 01 Pipeline.
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#334155]">
                Independent Azure Cognitive Services synchronized into one continuous voice
                recognition, telemetry, and speech synthesis station.
              </p>
              <ol className="flow mt-4 text-[#1c293c]">
                <li>Microphone Audio — Speech STT</li>
                <li>Computer Vision — OCR & Evidence</li>
                <li>Cognitive Parsing — AI Language</li>
                <li>Neural Voice — Synthesizer TTS</li>
              </ol>
            </TiltCard>
          </motion.div>
        )}
      </motion.div>

      {visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
          No services match that search. Try a keyword like “OCR”, “transcription” or “citations”.
        </p>
      )}

      <ServiceDialog service={active} onClose={closeDialog} />
    </>
  );
}
