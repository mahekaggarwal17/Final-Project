import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useMotionProfile, useMotionSettings } from "@/hooks/use-motion-profile";
import { createFrameBudget } from "@/hooks/use-frame-budget";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
  /** Short touch-only hint, e.g. "Drag to tilt". */
  hint?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "className">;

const REST = "rotateX(0deg) rotateY(0deg) translateZ(0)";
const EASE = 0.16; // per-frame lerp toward the pointer target

export function TiltCard({
  children,
  className = "",
  intensity = 10,
  hint,
  ...rest
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const target = useRef<{ px: number; py: number } | null>(null);
  const current = useRef({ px: 0.5, py: 0.5, lift: 0 });
  const dragging = useRef(false);
  const { reduced: prefReduced, lite } = useMotionProfile();
  const { settings } = useMotionSettings();
  const reduced = prefReduced || !settings.tilt;

  const stop = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  // Reduced motion: kill any in-flight frame and snap the card back to rest.
  useEffect(() => {
    if (!reduced) return;
    stop();
    dragging.current = false;
    target.current = null;
    current.current = { px: 0.5, py: 0.5, lift: 0 };
    const card = cardRef.current;
    if (card) {
      card.style.transform = REST;
      card.style.willChange = "auto";
    }
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, [reduced, stop]);

  // One smoothed write per allowed animation frame instead of a React render
  // per pointer event. The shared adaptive budget skips vsyncs on slow devices;
  // the lerp is time-normalised so the easing feels the same at any frame rate.
  const budget = useRef(createFrameBudget());
  const prevTime = useRef(0);

  const loop = useCallback(
    (now: number) => {
      const card = cardRef.current;
      if (!card) {
        frame.current = null;
        return;
      }
      if (!budget.current.shouldRender(now)) {
        frame.current = requestAnimationFrame(loop);
        return;
      }
      const started = performance.now();
      const step = prevTime.current
        ? Math.min(6, Math.max(0.2, (now - prevTime.current) / 16.667))
        : 1;
      prevTime.current = now;
      const ease = 1 - Math.pow(1 - EASE, step);

      const aim = target.current ?? { px: 0.5, py: 0.5 };
      const wantLift = target.current ? 1 : 0;
      const cur = current.current;
      cur.px += (aim.px - cur.px) * ease;
      cur.py += (aim.py - cur.py) * ease;
      cur.lift += (wantLift - cur.lift) * ease;

      const strength = intensity * settings.sensitivity * (lite ? 0.6 : 1) * cur.lift;
      card.style.transform = `rotateX(${(0.5 - cur.py) * strength * 2}deg) rotateY(${(cur.px - 0.5) * strength * 2}deg) translateZ(${18 * cur.lift}px)`;

      const glow = glowRef.current;
      if (glow) {
        glow.style.opacity = String(cur.lift);
        glow.style.background = `radial-gradient(320px circle at ${cur.px * 100}% ${cur.py * 100}%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 70%)`;
      }

      const settled =
        !target.current &&
        Math.abs(cur.lift) < 0.01 &&
        Math.abs(cur.px - 0.5) < 0.005 &&
        Math.abs(cur.py - 0.5) < 0.005;

      budget.current.measure(started);

      if (settled) {
        frame.current = null;
        prevTime.current = 0;
        cur.px = 0.5;
        cur.py = 0.5;
        cur.lift = 0;
        card.style.transform = REST;
        card.style.willChange = "auto";
        if (glow) glow.style.opacity = "0";
        return;
      }
      frame.current = requestAnimationFrame(loop);
    },
    [intensity, lite, settings.sensitivity],
  );

  const start = useCallback(() => {
    if (reduced) return;
    const card = cardRef.current;
    if (card) card.style.willChange = "transform";
    if (frame.current === null) frame.current = requestAnimationFrame(loop);
  }, [loop, reduced]);

  /* ---------- hover preview ----------
   * When card tilt is switched off (but the OS hasn't asked for reduced motion),
   * hovering plays one short scripted tilt-and-glow bump so the interaction is
   * discoverable — it never starts the continuous pointer-tracking loop. */
  const previewFrame = useRef<number | null>(null);
  const previewEligible = !prefReduced && settings.hoverPreview && !settings.tilt;

  useEffect(
    () => () => {
      if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current);
    },
    [],
  );

  const runPreview = useCallback(() => {
    if (!previewEligible || previewFrame.current !== null) return;
    const card = cardRef.current;
    if (!card) return;
    const glow = glowRef.current;
    const t0 = performance.now();
    const DURATION = 900;
    card.style.willChange = "transform";

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const bump = Math.sin(Math.PI * t); // 0 → 1 → 0
      const strength = intensity * settings.sensitivity * 0.5 * bump;
      card.style.transform = `rotateX(${strength * 0.8}deg) rotateY(${-strength * 1.3}deg) translateZ(${10 * bump}px)`;
      if (glow) {
        glow.style.opacity = String(bump * 0.65);
        glow.style.background = `radial-gradient(320px circle at ${28 + 44 * t}% 36%, color-mix(in oklab, var(--accent) 24%, transparent), transparent 70%)`;
      }
      if (t < 1) {
        previewFrame.current = requestAnimationFrame(step);
        return;
      }
      previewFrame.current = null;
      card.style.transform = REST;
      card.style.willChange = "auto";
      if (glow) glow.style.opacity = "0";
    };

    previewFrame.current = requestAnimationFrame(step);
  }, [intensity, previewEligible, settings.sensitivity]);

  const aimAt = (clientX: number, clientY: number) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    target.current = {
      px: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      py: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
    start();
  };

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === "mouse") return;
    // Touch / pen: tilt follows the finger while it stays down.
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    aimAt(e.clientX, e.clientY);
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    if (e.pointerType === "mouse" || dragging.current) aimAt(e.clientX, e.clientY);
  };

  const release = () => {
    dragging.current = false;
    if (reduced) return;
    // Keep the loop running so the card eases back to rest instead of snapping.
    target.current = null;
    start();
  };

  return (
    <div className="tilt-scene h-full" {...rest}>
      <div
        ref={cardRef}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          if (reduced) runPreview();
          else start();
        }}
        onFocus={() => reduced && runPreview()}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        style={{ transform: REST, contain: "paint", touchAction: "pan-y" }}
        className={`tilt-card ${className}`}
      >
        <div ref={glowRef} aria-hidden className="tilt-glow" style={{ opacity: 0 }} />
        <div className="tilt-content">{children}</div>
        {hint && (
          <span className="tilt-hint" aria-hidden>
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
