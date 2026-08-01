import { useCallback, useEffect, useState } from "react";

export type FocusRingStyle = "solid" | "dashed" | "double" | "halo";

export type FocusRingSettings = {
  style: FocusRingStyle;
  /** outline thickness in px */
  thickness: number;
};

export const focusRingStyleOptions: {
  id: FocusRingStyle;
  label: string;
  hint: string;
}[] = [
  { id: "solid", label: "Solid", hint: "One continuous outline (default)" },
  { id: "dashed", label: "Dashed", hint: "Dashed outline — easier to spot on busy 3D surfaces" },
  { id: "double", label: "Double", hint: "Two stacked lines for maximum definition" },
  { id: "halo", label: "Halo", hint: "Solid outline plus a soft glow around the element" },
];

export const FOCUS_MIN = 1;
export const FOCUS_MAX = 6;

const DEFAULTS: FocusRingSettings = { style: "solid", thickness: 2 };
const STORAGE_KEY = "capstone:focus-ring";

/* ---------- tiny cross-component store ---------- */

let current: FocusRingSettings = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function isStyle(v: unknown): v is FocusRingStyle {
  return v === "solid" || v === "dashed" || v === "double" || v === "halo";
}

function read(): FocusRingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<FocusRingSettings>;
    return {
      style: isStyle(parsed.style) ? parsed.style : DEFAULTS.style,
      thickness:
        typeof parsed.thickness === "number"
          ? Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, Math.round(parsed.thickness)))
          : DEFAULTS.thickness,
    };
  } catch {
    return DEFAULTS;
  }
}

/** Writes the choice onto the document root so every focus ring updates at once. */
function apply(s: FocusRingSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const outline = s.style === "halo" ? "solid" : s.style;
  // `double` needs at least 3px to render two visible lines.
  const width = s.style === "double" ? Math.max(3, s.thickness) : s.thickness;
  root.style.setProperty("--focus-ring-style", outline);
  root.style.setProperty("--focus-ring-width", `${width}px`);
  root.style.setProperty("--focus-ring-offset", `${Math.max(2, Math.round(width * 0.9))}px`);
  root.style.setProperty(
    "--focus-ring-halo",
    s.style === "halo"
      ? `0 0 0 ${width + 4}px color-mix(in oklab, var(--ring) 28%, transparent)`
      : "none",
  );
  root.dataset["focusRing"] = s.style;
}

function commit(next: FocusRingSettings) {
  current = next;
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep the in-memory value */
  }
  listeners.forEach((l) => l());
}

/**
 * User-chosen focus outline style and thickness, shared across the app and
 * persisted per device. Applied as CSS custom properties on <html>.
 */
export function useFocusRing() {
  const [, bump] = useState(0);

  useEffect(() => {
    const rerender = () => bump((n) => n + 1);
    listeners.add(rerender);
    if (!hydrated) {
      hydrated = true;
      current = read();
      apply(current);
      rerender();
    }
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const update = useCallback((patch: Partial<FocusRingSettings>) => {
    commit({ ...current, ...patch });
  }, []);

  const reset = useCallback(() => commit(DEFAULTS), []);

  return { settings: current, update, reset };
}
