import { useCallback, useEffect, useRef, useState } from "react";
import { services } from "@/components/ServiceGrid";
import { orbitPresets, useMotionProfile, useMotionSettings } from "@/hooks/use-motion-profile";
import { createFrameBudget } from "@/hooks/use-frame-budget";


const RADIUS = 40; // % of the scene box
const BASE_SPEED = 0.0035; // rad per 16.7ms frame at the "normal" preset
const MAX_SPEED = 0.09; // rad per frame — keeps flings readable
const DRAG_GAIN = 0.006; // rad per px
const KEY_SPIN = 0.22; // rad per arrow-key press
const KEY_TILT = 5; // deg per arrow-key press

const NODE_LABELS: Record<string, string> = {
  openai: "OpenAI",
  rag: "RAG",
  speech: "Speech",
  vision: "Vision",
  language: "Language",
};

const NODE_TINTS = ["var(--lilac)", "var(--mint)", "var(--skin)", "var(--sand)", "var(--signal)"];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));




/**
 * Interactive orbit visual. Drag (mouse, pen or touch) to spin the ring and
 * change its tilt; the ring keeps a slow auto-spin when idle. All updates are
 * written straight to the DOM inside one rAF loop, so no React renders happen
 * while dragging.
 */
export default function HeroOrbit() {
  const { reduced: prefReduced, lite } = useMotionProfile();
  const { settings } = useMotionSettings();
  const reduced = prefReduced || !settings.orbit;
  const preset = orbitPresets[settings.orbitPreset] ?? orbitPresets.normal;
  const [hintDismissed, setHintDismissed] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<(HTMLSpanElement | null)[]>([]);

  // The active preset is mirrored into a ref so pointer handlers always read the
  // current speed/tilt/inertia without re-binding.
  const presetRef = useRef(preset);
  presetRef.current = preset;

  const angle = useRef(0);
  const velocity = useRef(BASE_SPEED);
  const tilt = useRef(preset.restTilt);
  const dragging = useRef(false);
  const visible = useRef(true);
  const paused = useRef(false);
  const [spinPaused, setSpinPaused] = useState(false);
  const [status, setStatus] = useState("");


  // One shared DOM write for both the live loop and the hover preview.
  const draw = useCallback((ang: number, tl: number) => {
    const rings = ringsRef.current;
    if (rings) rings.style.transform = `rotateX(${tl}deg) rotateZ(${ang}rad)`;

    badgesRef.current.forEach((el, i) => {
      if (!el) return;
      const a = ((2 * Math.PI) / services.length) * i - Math.PI / 2 + ang;
      const depth = Math.sin(a); // -1 (back) .. 1 (front)
      const squash = Math.cos((tl * Math.PI) / 180);
      el.style.left = `calc(50% + ${Math.cos(a) * RADIUS}% - 2.1rem)`;
      el.style.top = `calc(50% + ${Math.sin(a) * RADIUS * squash}% - 2.1rem)`;
      el.style.transform = `scale(${0.86 + (depth + 1) * 0.09})`;
      el.style.opacity = String(0.62 + (depth + 1) * 0.19);
      el.style.zIndex = String(Math.round((depth + 1) * 10));
    });
  }, []);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const autoSpeed = BASE_SPEED * preset.speed;

    const render = () => draw(angle.current, tilt.current);

    let prev = performance.now();
    const budget = createFrameBudget();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // Adaptive throttle: skip this vsync when the device can't afford it.
      if (!visible.current || !budget.shouldRender(now)) {
        if (!visible.current) prev = now;
        return;
      }
      const started = performance.now();

      // Normalise to 60fps steps so inertia feels identical at any frame rate.
      const step = Math.min(6, Math.max(0.2, (now - prev) / 16.667));
      prev = now;

      if (paused.current) {
        // Keyboard "pause": hold the pose, keep rendering keyboard nudges.
        velocity.current = 0;
        render();
        budget.measure(started);
        return;
      }

      if (!dragging.current) {
        // Ease the drag momentum back down to the idle auto-spin.
        const decay = Math.pow(preset.friction, step);
        velocity.current =
          velocity.current * decay + autoSpeed * settings.sensitivity * (1 - decay);
        tilt.current += (preset.restTilt - tilt.current) * (1 - Math.pow(0.94, step));
      }
      angle.current += velocity.current * step;

      render();
      budget.measure(started);
    };


    render();
    frame = requestAnimationFrame(tick);

    const scene = sceneRef.current;
    const io = scene
      ? new IntersectionObserver(([entry]) => {
          visible.current = entry?.isIntersecting ?? true;
        })
      : null;
    if (scene && io) io.observe(scene);

    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
    };
  }, [draw, reduced, settings.sensitivity, preset]);

  // Reduced motion: cancel inertia and place the orbit back at its rest pose.
  useEffect(() => {
    if (!reduced) return;
    const restTilt = presetRef.current.restTilt;
    dragging.current = false;
    paused.current = false;
    setSpinPaused(false);
    velocity.current = 0;
    angle.current = 0;
    tilt.current = restTilt;
    const rings = ringsRef.current;
    if (rings) {
      rings.style.transform = `rotateX(${restTilt}deg)`;
      rings.style.willChange = "auto";
    }
    badgesRef.current.forEach((el, i) => {
      if (!el) return;
      const a = ((2 * Math.PI) / services.length) * i - Math.PI / 2;
      const squash = Math.cos((restTilt * Math.PI) / 180);
      el.style.left = `calc(50% + ${Math.cos(a) * RADIUS}% - 2.1rem)`;
      el.style.top = `calc(50% + ${Math.sin(a) * RADIUS * squash}% - 2.1rem)`;
      el.style.transform = "none";
      el.style.opacity = "1";
      el.style.zIndex = "1";
    });
  }, [reduced]);

  /* ---------- hover preview ----------
   * With the hero orbit switched off (and no OS reduced-motion request), a
   * hover or focus plays one short quarter-turn glide that settles back to the
   * rest pose. It never restarts the continuous spin loop. */
  const previewFrame = useRef<number | null>(null);
  const previewEligible = !prefReduced && settings.hoverPreview && !settings.orbit;

  useEffect(
    () => () => {
      if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current);
    },
    [],
  );

  const runPreview = useCallback(() => {
    if (!previewEligible || previewFrame.current !== null) return;
    const p = presetRef.current;
    const t0 = performance.now();
    const DURATION = 1300;
    const sweep = 0.85 * settings.sensitivity; // rad travelled and returned
    const rings = ringsRef.current;
    if (rings) rings.style.willChange = "transform";

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const bump = Math.sin(Math.PI * t); // 0 -> 1 -> 0, so it lands back at rest
      const eased = Math.sin((Math.PI * bump) / 2);
      draw(eased * sweep, p.restTilt - 6 * bump);
      if (t < 1) {
        previewFrame.current = requestAnimationFrame(step);
        return;
      }
      previewFrame.current = null;
      draw(0, p.restTilt);
      if (rings) rings.style.willChange = "auto";
    };

    previewFrame.current = requestAnimationFrame(step);
  }, [draw, previewEligible, settings.sensitivity]);

  const last = useRef({ x: 0, y: 0, t: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    dragging.current = true;
    if (paused.current) {
      paused.current = false;
      setSpinPaused(false);
    }
    velocity.current = 0;
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!hintDismissed) setHintDismissed(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const now = performance.now();
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    const dt = Math.max(1, now - last.current.t);
    last.current = { x: e.clientX, y: e.clientY, t: now };

    const p = presetRef.current;
    const delta = dx * DRAG_GAIN * settings.sensitivity;
    angle.current += delta;
    // Per-frame velocity from this move's speed, smoothed so flicks stay smooth.
    const instant = clamp((delta / dt) * 16.667, -MAX_SPEED, MAX_SPEED);
    velocity.current = velocity.current * 0.7 + instant * 0.3;
    tilt.current = clamp(
      tilt.current + dy * 0.25 * settings.sensitivity,
      p.tiltMin,
      p.tiltMax,
    );
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    // Stale pointer (finger held still before release) shouldn't fling.
    if (performance.now() - last.current.t > 120) {
      velocity.current = BASE_SPEED * presetRef.current.speed;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (reduced) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        setStatus("Orbit motion is off — your device requests reduced motion.");
      }
      return;
    }
    const p = presetRef.current;
    const gain = settings.sensitivity;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        angle.current += dir * KEY_SPIN * gain;
        velocity.current = 0;
        setStatus(`Orbit rotated ${e.key === "ArrowRight" ? "right" : "left"}.`);
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        e.preventDefault();
        const dir = e.key === "ArrowUp" ? -1 : 1;
        tilt.current = clamp(tilt.current + dir * KEY_TILT * gain, p.tiltMin, p.tiltMax);
        setStatus(`Orbit tilt ${Math.round(tilt.current)} degrees.`);
        break;
      }
      case " ":
      case "Spacebar":
      case "Enter": {
        e.preventDefault();
        const next = !paused.current;
        paused.current = next;
        setSpinPaused(next);
        if (!next) velocity.current = BASE_SPEED * p.speed * gain;
        setStatus(next ? "Orbit spin paused." : "Orbit spin resumed.");
        break;
      }
      case "Home": {
        e.preventDefault();
        angle.current = 0;
        tilt.current = p.restTilt;
        velocity.current = BASE_SPEED * p.speed * gain;
        paused.current = false;
        setSpinPaused(false);
        setStatus("Orbit reset to its starting pose.");
        break;
      }
      default:
        return;
    }
    if (!hintDismissed) setHintDismissed(true);
  };

  return (
    <div className="relative mx-auto flex shrink-0 flex-col items-center gap-3">
      <div
        ref={sceneRef}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse" && reduced) runPreview();
        }}
        onFocus={() => reduced && runPreview()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-label="Orbit of the five Azure AI services around a shared core. Drag with a pointer, or use arrow keys to rotate and tilt, space or enter to pause the spin, and Home to reset."
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Space Enter Home"
        aria-describedby="orbit-keyboard-help"
        className="tilt-scene orbit-grab relative h-72 w-72 rounded-full sm:h-96 sm:w-96 md:h-[26rem] md:w-[26rem]"
        style={{ contain: "layout paint", touchAction: "none" }}
      >

        <div className={`absolute inset-0 [transform-style:preserve-3d] ${lite ? "" : "animate-float"}`}>
          <div
            ref={ringsRef}
            className="absolute inset-0 [transform-style:preserve-3d]"
            style={{ transform: `rotateX(${preset.restTilt}deg)`, willChange: reduced ? "auto" : "transform" }}
          >
            <span aria-hidden className="orbit-ring border-dashed" />
            <span aria-hidden className="orbit-ring scale-[0.78] opacity-70" />
            <span aria-hidden className="orbit-ring scale-[0.56] opacity-50" />
          </div>
          {services.map((s, i) => {
            const a = ((2 * Math.PI) / services.length) * i - Math.PI / 2;
            return (
              <span
                key={s.id}
                ref={(el) => {
                  badgesRef.current[i] = el;
                }}
                role="img"
                aria-label={`${s.name} orbit node`}
                className="node-badge orbit-badge orbit-node-hover"
                style={{
                  ["--node-tint" as string]: NODE_TINTS[i % NODE_TINTS.length],
                  left: `calc(50% + ${Math.cos(a) * RADIUS}% - 2.1rem)`,
                  top: `calc(50% + ${Math.sin(a) * RADIUS * 0.53}% - 2.1rem)`,
                }}
              >
                <span aria-hidden className="flex flex-col items-center leading-none">
                  <span className="text-[0.6rem] opacity-60">{s.glyph}</span>
                  <span className="mt-0.5 text-[0.58rem] tracking-tight">
                    {NODE_LABELS[s.id] ?? s.name}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--lilac) 90%, transparent), transparent 65%), radial-gradient(circle at 70% 70%, color-mix(in oklab, var(--mint) 85%, transparent), transparent 62%)",
          }}
        />
        <div className="loader-core pointer-events-none absolute left-1/2 top-1/2 z-20 h-28 w-28 -translate-x-1/2 -translate-y-1/2" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Azure
          <br />
          AI core
        </div>
      </div>

      {!reduced && (
        <p
          className={`interaction-hint transition-opacity duration-500 ${
            hintDismissed ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden={hintDismissed}
        >
          <span aria-hidden>✥</span> Drag or swipe to orbit
        </p>
      )}

      <p id="orbit-keyboard-help" className="max-w-64 text-center text-xs text-muted-foreground">
        {reduced
          ? "Orbit motion is off because reduced motion is requested."
          : `Focus the orbit, then use ← → to rotate, ↑ ↓ to tilt, Space or Enter to ${
              spinPaused ? "resume" : "pause"
            } the spin, and Home to reset.`}
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>



    </div>
  );
}
