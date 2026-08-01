/**
 * Adaptive frame-rate throttle shared by the hero 3D animations.
 *
 * Every animated scene reports how long its own work takes (EMA of measured
 * frame cost). If the device can't keep up, the shared target frame rate steps
 * down (60 -> 45 -> 30 -> 24fps) so the main thread stays responsive; when
 * frames are cheap again it steps back up. Callers keep their maths
 * time-normalised, so a lower cap only means fewer, larger steps — never a
 * different feel.
 *
 * This is purely a scheduling layer: reduced-motion paths never create a
 * budget, so nothing here can re-enable motion.
 */

const STEPS = [60, 45, 30, 24] as const;

/** Cheap starting cap from device signals; refined at runtime by measurement. */
function initialIndex(): number {
  if (typeof navigator === "undefined") return 0;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  if (cores <= 2 || memory <= 2) return 2;
  if (cores <= 4 || memory <= 4) return 1;
  return 0;
}

let index = -1;
let cost = 0; // EMA of per-frame work in ms across all scenes
let lastChange = 0;

function targetFps(): number {
  if (index < 0) index = initialIndex();
  return STEPS[index] ?? 60;
}

/** Budget in ms: 60% of the frame slot at the current cap. */
function budget(): number {
  return (1000 / targetFps()) * 0.6;
}

function observe(ms: number, now: number) {
  cost = cost === 0 ? ms : cost * 0.85 + ms * 0.15;
  // Don't thrash: at most one change every 700ms.
  if (now - lastChange < 700) return;

  if (cost > budget() && index < STEPS.length - 1) {
    index += 1;
    lastChange = now;
  } else if (cost < budget() * 0.45 && index > initialIndex()) {
    index -= 1;
    lastChange = now;
  }
}

export type FrameBudget = {
  /** true when enough time has passed to render at the current adaptive cap */
  shouldRender: (now: number) => boolean;
  /** call right after the frame's work with the timestamp it started */
  measure: (startedAt: number) => void;
  /** current adaptive cap, for debugging/telemetry */
  fps: () => number;
};

/** Live counters for the on-screen performance indicator. */
let rendered = 0;
let skipped = 0;

export type FrameBudgetStats = {
  /** adaptive cap currently in effect */
  targetFps: number;
  /** EMA of per-frame animation work, in ms */
  costMs: number;
  /** ms of work the current cap allows per frame */
  budgetMs: number;
  /** frames actually drawn since load */
  rendered: number;
  /** vsyncs intentionally skipped by the throttle since load */
  skipped: number;
};

export function frameBudgetStats(): FrameBudgetStats {
  return {
    targetFps: targetFps(),
    costMs: cost,
    budgetMs: budget(),
    rendered,
    skipped,
  };
}

/**
 * Creates a per-scene view of the shared adaptive budget. Not a React hook —
 * call it inside the effect that owns the rAF loop.
 */
export function createFrameBudget(): FrameBudget {
  let lastRender = 0;

  return {
    shouldRender(now: number) {
      const interval = 1000 / targetFps();
      // 2ms slack so a 60fps cap never drops every other vsync.
      if (now - lastRender < interval - 2) {
        skipped += 1;
        return false;
      }
      lastRender = now;
      rendered += 1;
      return true;
    },
    measure(startedAt: number) {
      const end = performance.now();
      observe(end - startedAt, end);
    },
    fps: targetFps,
  };
}

