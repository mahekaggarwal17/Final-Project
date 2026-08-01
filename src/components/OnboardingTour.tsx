import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Step = {
  target: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    target: '[data-tour="orbit"]',
    title: "The response core",
    body: "Each floating badge is one live Azure AI service feeding the CivicPulse core. Move your pointer to steer the scene in 3D; on touch or low-power devices it stays calm and static.",

  },
  {
    target: '[data-tour="card"]',
    title: "Cards tilt with your cursor",
    body: "Move your pointer across a card — it tilts in 3D and a glow follows the cursor. Keyboard users get the same info without motion.",
  },
  {
    target: '[data-tour="details"]',
    title: "Open the detail modal",
    body: "Click anywhere on a card to read what the service does, how the pipeline works, and real example inputs and outputs.",
  },
  {
    target: '[data-tour="open-module"]',
    title: "Run the live demo here",
    body: "\"Open module\" loads the deployed service inside this site, so you can try every demo without ever leaving the hub.",
  },
];

const KEY = "azure-capstone-tour-v1";

type Box = { top: number; left: number; width: number; height: number };

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const raf = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLOListElement>(null);
  // Furthest step reached this run — earlier steps stay jumpable, later ones don't.
  const [furthest, setFurthest] = useState(0);
  // Where focus should land after a step change: the primary action, or the
  // progress button the user just activated.
  const focusTarget = useRef<"next" | "progress">("next");

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage blocked — skip auto-start */
    }
    return undefined;
  }, []);

  const step = STEPS[i]!;

  useEffect(() => {
    setFurthest((prev) => Math.max(prev, i));
  }, [i]);

  const measure = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) return setBox(null);
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const r = el.getBoundingClientRect();
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    measure();
    const remeasure = () => {
      const el = document.querySelector(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    // Re-measure once the smooth scroll settles.
    const settle = setTimeout(remeasure, 450);
    const onScrollOrResize = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(remeasure);
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [open, measure, step.target]);


  const finish = useCallback(() => {
    setOpen(false);
    setI(0);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    // Send focus back to the launcher so keyboard users keep their place.
    requestAnimationFrame(() => startRef.current?.focus());
  }, []);

  // Move focus into the panel on open, and keep it on the primary action as
  // steps change so the announcement and focus stay in sync.
  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      if (focusTarget.current === "progress") {
        progressRef.current
          ?.querySelector<HTMLButtonElement>(`[data-step-index="${i}"]`)
          ?.focus();
      } else {
        nextRef.current?.focus();
      }
      focusTarget.current = "next";
    });
    return () => cancelAnimationFrame(t);
  }, [open, i]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // Trap Tab inside the walkthrough panel.
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes || nodes.length === 0) return;
        const list = Array.from(nodes).filter((n) => !n.hasAttribute("disabled"));
        const first = list[0]!;
        const last = list[list.length - 1]!;
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (activeEl === first || !panelRef.current?.contains(activeEl))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (activeEl === last || !panelRef.current?.contains(activeEl))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((p) => Math.min(p + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  const start = () => {
    setI(0);
    setFurthest(0);
    setOpen(true);
  };

  const jumpTo = (index: number) => {
    focusTarget.current = "progress";
    setI(index);
  };

  if (!open) {
    return (
      <button
        ref={startRef}
        type="button"
        onClick={start}
        aria-label="Start the guided walkthrough of the 3D interactions"
        className="fixed bottom-5 right-5 z-40 rounded-none border bg-card/90 px-4 py-2 text-sm font-medium text-card-foreground shadow-lg backdrop-blur transition-transform hover:scale-105"
      >
        How to explore ?
      </button>
    );
  }

  const pad = 8;
  const spot = box
    ? {
        top: box.top - pad,
        left: box.left - pad,
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      }
    : null;

  const below = spot ? spot.top + spot.height + 16 : 120;
  const placeAbove = spot ? below + 210 > window.innerHeight : false;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
    >
      {/* Announces each step to screen readers as it becomes active. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Step ${i + 1} of ${STEPS.length}: ${step.title}. ${step.body}`}
      </p>
      <button
        type="button"
        aria-label="Skip walkthrough"
        onClick={finish}
        className="absolute inset-0 h-full w-full cursor-default bg-[oklch(0.32_0.04_265_/_0.22)] backdrop-blur-[2px]"
      />

      {spot && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-none border-2 border-accent transition-all duration-300"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow:
              "0 0 0 2px color-mix(in oklab, var(--accent) 40%, transparent), 0 0 40px 6px color-mix(in oklab, var(--accent) 30%, transparent)",
            background: "color-mix(in oklab, var(--accent) 8%, transparent)",
          }}
        />
      )}


      <div
        ref={panelRef}
        aria-label={`Walkthrough step ${i + 1} of ${STEPS.length}`}
        className="absolute w-[min(22rem,calc(100vw-2rem))] rounded-none border bg-card p-5 shadow-2xl animate-scale-in"
        style={{
          top: spot
            ? placeAbove
              ? Math.max(16, spot.top - 16 - 210)
              : below
            : 120,
          left: spot
            ? Math.min(Math.max(16, spot.left), window.innerWidth - 16 - Math.min(352, window.innerWidth - 32))
            : 16,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent" aria-hidden>
          Step {i + 1} of {STEPS.length}
        </p>
        <h3 id="tour-title" className="mt-2 text-lg font-semibold text-card-foreground">
          {step.title}
        </h3>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>
        <nav aria-label="Walkthrough progress" className="mt-4">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={i + 1}
            aria-valuetext={`Step ${i + 1} of ${STEPS.length}: ${step.title}`}
            className="h-1 w-full overflow-hidden rounded-none bg-border/70"
          >
            <div
              aria-hidden
              className="h-full rounded-none bg-accent transition-[width] duration-300"
              style={{ width: `${((i + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <ol ref={progressRef} className="mt-3 flex list-none items-center gap-2 p-0">
            {STEPS.map((s, index) => {
              const isCurrent = index === i;
              const isDone = index < furthest || (index < i);
              const reachable = index <= furthest;
              const state = isCurrent ? "current step" : isDone ? "completed" : "not visited yet";
              return (
                <li key={s.target} className="flex-1">
                  <button
                    type="button"
                    data-step-index={index}
                    disabled={!reachable || isCurrent}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Step ${index + 1} of ${STEPS.length}: ${s.title} — ${state}${
                      reachable && !isCurrent ? ". Activate to go back to this step" : ""
                    }`}
                    onClick={() => reachable && !isCurrent && jumpTo(index)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-none border px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default ${
                      isCurrent
                        ? "border-accent bg-accent/20 text-accent"
                        : reachable
                          ? "border-accent/40 text-card-foreground hover:bg-accent/10"
                          : "border-border/70 text-muted-foreground opacity-60"
                    }`}
                  >
                    <span aria-hidden>{isCurrent ? "●" : isDone ? "✓" : index + 1}</span>
                    <span className="sr-only">{`Step ${index + 1}, ${state}`}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <p className="mt-3 text-xs text-muted-foreground">
          Step {i + 1} of {STEPS.length}. Use the arrow keys to move between steps, the progress
          buttons above to revisit a completed step, or Escape to exit.
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            aria-label="Skip the walkthrough"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI(i - 1)}
                aria-label={`Back to step ${i} of ${STEPS.length}`}
                className="rounded-none border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Back
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (i === STEPS.length - 1 ? finish() : setI(i + 1))}
              aria-label={
                i === STEPS.length - 1
                  ? "Finish the walkthrough"
                  : `Next: step ${i + 2} of ${STEPS.length}`
              }
              className="rounded-none bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {i === STEPS.length - 1 ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTour;
