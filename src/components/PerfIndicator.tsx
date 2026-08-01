import { useEffect, useRef, useState } from "react";
import { frameBudgetStats } from "@/hooks/use-frame-budget";
import { useMotionQuality, useMotionSettings } from "@/hooks/use-motion-profile";

type Sample = {
  fps: number;
  dropped: number;
  cap: number;
  heavy: boolean;
};

const WINDOW_MS = 500;

/**
 * Small live read-out of the animation frame rate and dropped frames.
 *
 * It samples its own rAF loop (twice per second) and reads the shared adaptive
 * frame budget, so it reports what the 3D scenes actually achieve rather than a
 * theoretical target. When the device can't keep up it offers a one-tap way to
 * lighten the motion settings. The loop never runs while motion is off, so it
 * costs nothing in reduced-motion mode.
 */
export function PerfIndicator({ active, className = "" }: { active: boolean; className?: string }) {
  const [sample, setSample] = useState<Sample | null>(null);
  const { settings, update } = useMotionSettings();
  const { quality, setQuality, systemReduced } = useMotionQuality();
  const heavyStreak = useRef(0);

  useEffect(() => {
    if (!active) {
      setSample(null);
      heavyStreak.current = 0;
      return;
    }

    let frame = 0;
    let windowStart = performance.now();
    let frames = 0;
    let dropped = 0;
    let prev = windowStart;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const stats = frameBudgetStats();
      const expected = 1000 / stats.targetFps;
      const delta = now - prev;
      prev = now;
      frames += 1;
      // A gap well past the expected interval means the frame never landed.
      if (delta > expected * 1.6) dropped += Math.round(delta / expected) - 1;

      if (now - windowStart >= WINDOW_MS) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        const heavy = fps < stats.targetFps - 12 || stats.costMs > stats.budgetMs;
        heavyStreak.current = heavy ? heavyStreak.current + 1 : 0;
        setSample({ fps, dropped, cap: stats.targetFps, heavy: heavyStreak.current >= 3 });
        windowStart = now;
        frames = 0;
        dropped = 0;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active || !sample) return null;

  const tone = sample.heavy
    ? "text-destructive"
    : sample.fps >= sample.cap - 6
      ? "text-accent"
      : "text-muted-foreground";

  const lighten = () => {
    update({ orbitPreset: "slow", sensitivity: 0.6 });
    if (!systemReduced && quality === "high") setQuality("balanced");
    heavyStreak.current = 0;
  };

  return (
    <div
      className={`w-full rounded-none border border-border/70 bg-background/60 px-3 py-2 text-xs backdrop-blur ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Performance
        </span>
        <span
          role="status"
          aria-live="off"
          aria-label={`${sample.fps} frames per second, cap ${sample.cap}, ${sample.dropped} dropped frames in the last half second`}
          className={`font-semibold tabular-nums ${tone}`}
        >
          {sample.fps} fps
          <span className="text-muted-foreground"> / {sample.cap} cap</span>
          <span className="text-muted-foreground"> · {sample.dropped} dropped</span>
        </span>
      </div>

      {sample.heavy && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2" role="alert">
          <p className="text-destructive">
            Motion settings look heavy for this device — frames are being dropped.
          </p>
          <button
            type="button"
            onClick={lighten}
            className="rounded-none border border-border/70 px-2.5 py-1 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Lighten settings
          </button>
        </div>
      )}

      {!sample.heavy && (
        <p className="mt-1 text-muted-foreground">
          {settings.orbitPreset === "dramatic"
            ? "Dramatic preset running smoothly."
            : "Frame pacing is healthy."}
        </p>
      )}
    </div>
  );
}
