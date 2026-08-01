import { useCallback, useEffect, useState } from "react";

export type MotionQuality = "high" | "balanced" | "reduced";

export type MotionProfile = {
  /** true once we know the client's capabilities (false during SSR) */
  ready: boolean;
  /** no decorative motion at all */
  reduced: boolean;
  /** downgrade decorative 3D work (balanced or reduced) */
  lite: boolean;
  /** the OS/browser asked for reduced motion */
  systemReduced: boolean;
  /** the quality currently in effect */
  quality: MotionQuality;
  /** true when the quality came from the auto device/preference detection */
  auto: boolean;
};

const STORAGE_KEY = "capstone:motion-quality";

export const motionQualityOptions: { id: MotionQuality; label: string; hint: string }[] = [
  { id: "high", label: "High", hint: "Full 3D tilt, glow and orbit motion" },
  { id: "balanced", label: "Balanced", hint: "Softer tilt, lighter effects" },
  { id: "reduced", label: "Reduced", hint: "Motion off — static layout only" },
];

/* ---------- tiny cross-component store ---------- */

let override: MotionQuality | null = null;
let detected: MotionQuality | null = null;
let systemReduced = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readStored(): MotionQuality | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "high" || raw === "balanced" || raw === "reduced" ? raw : null;
  } catch {
    return null;
  }
}

function detect(): MotionQuality {
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  systemReduced = reduceQuery.matches;
  if (systemReduced) return "reduced";

  const coarseQuery = window.matchMedia("(hover: none), (pointer: coarse)");
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const weakHardware = cores <= 4 || memory <= 4;

  return coarseQuery.matches || weakHardware ? "balanced" : "high";
}

export function setMotionQuality(quality: MotionQuality | null) {
  override = quality;
  try {
    if (quality) localStorage.setItem(STORAGE_KEY, quality);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — keep the in-memory value */
  }
  emit();
}

/**
 * Detects reduced-motion preference plus cheap low-end-device signals, and lets
 * the user override the result with an explicit motion-quality choice.
 */
export function useMotionProfile(): MotionProfile {
  const [, bump] = useState(0);

  useEffect(() => {
    const rerender = () => bump((n) => n + 1);
    listeners.add(rerender);

    if (override === null) override = readStored();
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseQuery = window.matchMedia("(hover: none), (pointer: coarse)");

    const update = () => {
      detected = detect();
      emit();
    };
    update();

    reduceQuery.addEventListener("change", update);
    coarseQuery.addEventListener("change", update);
    return () => {
      listeners.delete(rerender);
      reduceQuery.removeEventListener("change", update);
      coarseQuery.removeEventListener("change", update);
    };
  }, []);

  // A system-level reduced-motion request always wins: inertia and tilt stay off
  // even if this device previously opted into a richer quality.
  const quality: MotionQuality = systemReduced ? "reduced" : (override ?? detected ?? "high");
  return {
    ready: detected !== null,
    reduced: quality === "reduced",
    lite: quality !== "high",
    systemReduced,
    quality,
    auto: override === null,
  };
}

/* ---------- orbit presets ---------- */

export type OrbitPresetId = "slow" | "normal" | "dramatic";

export type OrbitPreset = {
  id: OrbitPresetId;
  label: string;
  hint: string;
  /** multiplier on the idle auto-spin speed */
  speed: number;
  /** per-frame inertia friction — higher keeps a fling alive longer */
  friction: number;
  /** resting vertical tilt, plus the range a drag can reach */
  restTilt: number;
  tiltMin: number;
  tiltMax: number;
};

export const orbitPresets: Record<OrbitPresetId, OrbitPreset> = {
  slow: {
    id: "slow",
    label: "Slow",
    hint: "Gentle drift, shallow tilt, momentum settles fast",
    speed: 0.5,
    friction: 0.9,
    restTilt: 64,
    tiltMin: 46,
    tiltMax: 72,
  },
  normal: {
    id: "normal",
    label: "Normal",
    hint: "Balanced spin, tilt and glide",
    speed: 1,
    friction: 0.94,
    restTilt: 58,
    tiltMin: 30,
    tiltMax: 76,
  },
  dramatic: {
    id: "dramatic",
    label: "Dramatic",
    hint: "Faster spin, wide tilt, long-gliding inertia",
    speed: 1.9,
    friction: 0.975,
    restTilt: 50,
    tiltMin: 12,
    tiltMax: 84,
  },
};

export const orbitPresetList: OrbitPreset[] = [
  orbitPresets.slow,
  orbitPresets.normal,
  orbitPresets.dramatic,
];

/* ---------- user toggles: orbit, tilt, sensitivity ---------- */

export type MotionSettings = {
  orbit: boolean;
  tilt: boolean;
  /** 0.4 (subtle) .. 1.6 (strong) multiplier on 3D movement */
  sensitivity: number;
  /** speed + tilt range + inertia, bundled into one choice */
  orbitPreset: OrbitPresetId;
  /** brief taster animation on hover when orbit/tilt motion is switched off */
  hoverPreview: boolean;
};

const SETTINGS_KEY = "capstone:motion-settings";
const defaultSettings: MotionSettings = {
  orbit: true,
  tilt: true,
  sensitivity: 1,
  orbitPreset: "normal",
  hoverPreview: true,
};
let settings: MotionSettings | null = null;

function readSettings(): MotionSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<MotionSettings>;
    const preset = parsed.orbitPreset;
    return {
      orbit: parsed.orbit ?? true,
      tilt: parsed.tilt ?? true,
      sensitivity: Math.min(1.6, Math.max(0.4, Number(parsed.sensitivity) || 1)),
      orbitPreset:
        preset === "slow" || preset === "normal" || preset === "dramatic" ? preset : "normal",
      hoverPreview: parsed.hoverPreview ?? true,
    };
  } catch {
    return defaultSettings;
  }
}

/** Orbit/tilt toggles plus the sensitivity multiplier, persisted per device. */
export function useMotionSettings() {
  const [, bump] = useState(0);

  useEffect(() => {
    const rerender = () => bump((n) => n + 1);
    listeners.add(rerender);
    if (settings === null) {
      settings = readSettings();
      emit();
    }
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const value = settings ?? defaultSettings;

  const update = useCallback((patch: Partial<MotionSettings>) => {
    settings = { ...(settings ?? defaultSettings), ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — keep the in-memory value */
    }
    emit();
  }, []);

  const reset = useCallback(() => {
    settings = defaultSettings;
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  return { settings: value, update, reset };
}

/** Read + write the motion-quality setting. */
export function useMotionQuality() {
  const { quality, auto, systemReduced } = useMotionProfile();
  const set = useCallback((q: MotionQuality) => setMotionQuality(q), []);
  const reset = useCallback(() => setMotionQuality(null), []);
  return { quality, auto, systemReduced, setQuality: set, resetQuality: reset };
}
