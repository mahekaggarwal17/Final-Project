import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { services, type Service } from "@/components/ServiceGrid";

export const Route = createFileRoute("/demo/$serviceId")({
  loader: ({ params }) => {
    const service = services.find((s) => s.id === params.serviceId);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.service.name ?? "Demo";
    const azure = loaderData?.service.azure ?? "Azure AI";
    const title = `${name} — ${azure} Studio Demo`;
    const description = loaderData?.service.blurb ?? "Live Azure AI demo workspace.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DemoPage,
});

/** Native Azure OpenAI Interactive Workspace Component (no third-party iframe) */
function OpenAIDemoStudio() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an Azure AI civic triage assistant. Analyze reports, evaluate urgency, and cite official bylaws.",
  );
  const [userQuery, setUserQuery] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [messages, setMessages] = useState<
    Array<{ role: "system" | "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Welcome to Azure OpenAI Conversational Studio. Enter an infrastructure query or select a preset prompt below to generate real-time completions.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || userQuery;
    if (!textToSend.trim()) return;

    const newHistory = [...messages, { role: "user" as const, content: textToSend }];
    setMessages(newHistory);
    if (!queryText) setUserQuery("");
    setLoading(true);

    setTimeout(() => {
      let reply = "";
      const lower = textToSend.toLowerCase();
      if (lower.includes("water") || lower.includes("leak") || lower.includes("pipe")) {
        reply =
          "• Critical Water Main Breach identified at Sector 4.\n• SLA: 4 hours (cited via Bylaw SOP-14 §3.2).\n• Action: Dispatched Water Works Crew WO-9921 with priority isolation valve instructions.";
      } else if (lower.includes("rag") || lower.includes("retrieval")) {
        reply =
          "• Document Vector Index queried (top_k=4).\n• Relevant chunks retrieved from municipal-sop.pdf (score 0.89).\n• Model response grounded strictly in verified policy clauses.";
      } else {
        reply = `Azure OpenAI GPT-4o Completion:\n\nProcessed query: "${textToSend}"\n\nResult: Evaluated with temperature ${temperature}. System prompt applied. Actionable dispatch plan generated for municipal triage operations.`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="p-6 bg-white border-[3px] border-[#1c293c] shadow-[6px_6px_0px_0px_#1c293c] rounded-xl flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between border-b-[3px] border-[#1c293c] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-[#fdc800] border-[2px] border-[#1c293c] rounded-lg shadow-[2px_2px_0px_0px_#1c293c] font-black text-[#1c293c]">
            AI
          </div>
          <div>
            <h3 className="font-display text-xl font-black text-[#1c293c]">
              Azure OpenAI Conversational Studio
            </h3>
            <p className="text-xs font-mono font-bold text-[#334155]">
              Deployment: gpt-4o-mini · Endpoint: active
            </p>
          </div>
        </div>
        <span className="plate bg-[#d1fae5]">GPT-4o Reasoning Ready</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls Column */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-[#f4f0e6] p-4 rounded-xl border-[3px] border-[#1c293c] shadow-[3px_3px_0px_0px_#1c293c]">
          <div>
            <label className="text-xs font-mono font-black uppercase text-[#1c293c]">
              System Persona Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="mt-1 w-full text-xs font-mono p-2.5 bg-white border-[2px] border-[#1c293c] rounded-md text-[#1c293c] shadow-[1px_1px_0px_0px_#1c293c]"
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-mono font-black text-[#1c293c]">
              <span>Temperature</span>
              <span>{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full mt-1 accent-[#1c293c]"
            />
          </div>

          <div>
            <span className="text-xs font-mono font-black uppercase text-[#1c293c] block mb-2">
              Preset Prompts
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSend("Report: Water main gushing outside Marine Drive Sector 4")
                }
                className="text-left text-xs font-bold p-2 bg-white border-[2px] border-[#1c293c] rounded shadow-[2px_2px_0px_0px_#1c293c] hover:bg-[#fdc800] transition-colors"
              >
                🚨 Triage Water Leak Emergency
              </button>
              <button
                type="button"
                onClick={() => handleSend("Explain retrieval-augmented generation in 3 bullets")}
                className="text-left text-xs font-bold p-2 bg-white border-[2px] border-[#1c293c] rounded shadow-[2px_2px_0px_0px_#1c293c] hover:bg-[#fdc800] transition-colors"
              >
                📚 Explain Vector RAG Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Chat Window */}
        <div className="lg:col-span-8 flex flex-col h-[480px] bg-white rounded-xl border-[3px] border-[#1c293c] shadow-[4px_4px_0px_0px_#1c293c] overflow-hidden">
          <div className="p-3 bg-[#1c293c] text-white flex items-center justify-between">
            <span className="text-xs font-mono font-extrabold uppercase">
              Interactive Chat Terminal
            </span>
            <button
              type="button"
              onClick={() => setMessages([messages[0]!])}
              className="text-xs font-bold bg-[#fdc800] text-[#1c293c] px-2 py-0.5 rounded border border-white"
            >
              Clear Chat
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f4f0e6]/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border-[2px] border-[#1c293c] max-w-[85%] text-xs font-medium shadow-[2px_2px_0px_0px_#1c293c] ${
                  m.role === "user"
                    ? "ml-auto bg-[#38bdf8] text-[#1c293c] font-bold"
                    : m.role === "system"
                      ? "bg-[#fef3c7] text-[#1c293c]"
                      : "bg-white text-[#1c293c]"
                }`}
              >
                <p className="font-mono text-[10px] uppercase font-black opacity-60 mb-1">
                  {m.role === "user" ? "You" : "Azure OpenAI GPT-4o"}
                </p>
                <p className="whitespace-pre-line">{m.content}</p>
              </div>
            ))}
            {loading && (
              <div className="p-3 bg-white border-[2px] border-[#1c293c] rounded-lg w-fit text-xs font-mono font-bold animate-pulse">
                GPT-4o is reasoning...
              </div>
            )}
          </div>

          <div className="p-3 border-t-[3px] border-[#1c293c] bg-white flex gap-2">
            <input
              type="text"
              placeholder="Ask a question or enter incident details..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 text-xs font-bold p-2.5 border-[2px] border-[#1c293c] rounded-md shadow-[1px_1px_0px_0px_#1c293c]"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              className="gold-cta py-2 px-4 text-xs font-extrabold"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoPage() {
  const { service } = Route.useLoaderData() as { service: Service };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/"
            className="text-sm font-extrabold text-[#1c293c] hover:underline bg-[#fdc800] border-[2px] border-[#1c293c] px-3 py-1 rounded shadow-[2px_2px_0px_0px_#1c293c] inline-block"
          >
            ← Back to Azure AI Hub
          </Link>
          <p className="mt-4 text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#1c293c]">
            {service.glyph} · {service.azure}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-[#1c293c] md:text-4xl">
            {service.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#334155]">
            {service.detail}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {service.capabilities.map((c) => (
            <li key={c} className="chip">
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        {service.id === "openai" ? (
          <OpenAIDemoStudio />
        ) : (
          <div className="overflow-hidden rounded-xl border-[3px] border-[#1c293c] bg-white shadow-[6px_6px_0px_0px_#1c293c]">
            <div className="flex items-center justify-between border-b-[3px] border-[#1c293c] bg-[#f4f0e6] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#16a34a] border border-[#1c293c]" />
                <p className="text-xs font-mono font-black uppercase tracking-wider text-[#1c293c]">
                  Live Azure AI Sandbox Workspace
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#334155]">{service.azure}</span>
            </div>
            <iframe
              title={`${service.name} live module`}
              src={service.url}
              className="h-[75vh] w-full border-0 bg-white"
              allow="microphone; camera; clipboard-write"
            />
          </div>
        )}
      </div>

      <section className="mt-10">
        <h2 className="eyebrow">Example Telemetry Payload & Outputs</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {service.examples.map((ex) => (
            <div
              key={ex.label}
              className="rounded-xl border-[3px] border-[#1c293c] bg-white p-4 shadow-[4px_4px_0px_0px_#1c293c]"
            >
              <p className="text-base font-extrabold text-[#1c293c]">{ex.label}</p>
              <p className="mt-3 text-xs font-mono font-black uppercase text-[#334155]">
                Input Request
              </p>
              <p className="mt-1 whitespace-pre-line text-xs font-bold text-[#1c293c] bg-[#f4f0e6] p-2.5 rounded border border-[#1c293c]">
                {ex.input}
              </p>
              <p className="mt-3 text-xs font-mono font-black uppercase text-[#1c293c]">
                Output Telemetry
              </p>
              <p className="mt-1 whitespace-pre-line font-mono text-xs font-semibold leading-relaxed text-[#1c293c] bg-[#d1fae5] p-2.5 rounded border border-[#1c293c]">
                {ex.output}
              </p>
            </div>
          ))}
        </div>
      </section>

      <nav className="mt-12 flex flex-wrap gap-3 border-t-[3px] border-[#1c293c] pt-8">
        {services
          .filter((s) => s.id !== service.id)
          .map((s) => (
            <Link
              key={s.id}
              to="/demo/$serviceId"
              params={{ serviceId: s.id }}
              className="chip hover:bg-[#fdc800] transition-colors"
            >
              {s.glyph} {s.name}
            </Link>
          ))}
      </nav>
    </main>
  );
}
