import { useEffect, useRef, useState } from "react";

const STEPS = [
  "Listening for reports",
  "Reading photo evidence",
  "Scoring urgency",
  "Citing city bylaws",
];


const NODE_TINTS = ["var(--lilac)", "var(--mint)", "var(--skin)", "var(--sand)", "var(--signal)"];

/**
 * Full-screen lucid loading veil. Fades itself out once the app has hydrated
 * and one idle frame has passed, so the hero never pops in half-painted.
 */
export function LucidLoader() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const cycle = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 520);
    const start = window.setTimeout(() => setLeaving(true), 1500);
    const end = window.setTimeout(() => setGone(true), 2060);
    timers.current = [cycle, start, end];
    return () => {
      window.clearInterval(cycle);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="loader-veil"
      data-leaving={leaving}
      role="status"
      aria-live="polite"
      aria-label="Loading the Azure AI hub"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="loader-blob left-[8%] top-[12%] h-64 w-64"
          style={{ background: "var(--lilac)" }}
        />
        <span
          className="loader-blob right-[6%] top-[22%] h-72 w-72"
          style={{ background: "var(--mint)", animationDelay: "-2.5s" }}
        />
        <span
          className="loader-blob bottom-[10%] left-[38%] h-72 w-72"
          style={{ background: "var(--skin)", animationDelay: "-5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">
        <div className="relative h-40 w-40" aria-hidden>
          <span className="loader-ring" />
          <span
            className="loader-ring scale-[0.72]"
            style={{ animationDirection: "reverse", animationDuration: "5s" }}
          />
          <span className="loader-ring scale-[0.44]" style={{ animationDuration: "7s" }} />
          {NODE_TINTS.map((tint, i) => {
            const a = ((2 * Math.PI) / NODE_TINTS.length) * i - Math.PI / 2;
            return (
              <span
                key={tint}
                className="loader-dot"
                style={{
                  background: tint,
                  left: `calc(50% + ${Math.cos(a) * 46}% - 0.4rem)`,
                  top: `calc(50% + ${Math.sin(a) * 46}% - 0.4rem)`,
                }}
              />
            );
          })}
          <span className="loader-core absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-lg tracking-tight">CivicPulse</p>
          <p className="label-mono text-muted-foreground">{STEPS[step]}</p>
          <span className="loader-track" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default LucidLoader;
