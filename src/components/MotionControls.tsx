import {
  orbitPresetList,
  orbitPresets,
  useMotionProfile,
  useMotionSettings,
} from "@/hooks/use-motion-profile";
import { MotionQualitySetting } from "./MotionQualitySetting";
import { FocusRingSetting } from "./FocusRingSetting";

function Toggle({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked && !disabled}
        aria-label={`${label} — ${hint}`}
        aria-keyshortcuts="Space Enter ArrowLeft ArrowRight"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          // Space/Enter are native on a button; arrows set the state explicitly.
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!checked) onChange(true);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            if (checked) onChange(false);
          }
        }}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-none border border-border/70 p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 ${
          checked && !disabled ? "bg-accent/30" : "bg-background/70"
        }`}
      >
        <span
          aria-hidden
          className={`block h-4 w-4 rounded-none bg-foreground transition-transform ${
            checked && !disabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Compact in-app panel for the 3D experience: orbit + tilt switches, a
 * sensitivity slider and the reduced-motion / quality selector.
 */
export function MotionControls({ className = "" }: { className?: string }) {
  const { settings, update, reset } = useMotionSettings();
  const { reduced } = useMotionProfile();

  return (
    <section aria-labelledby="motion-controls-title" className={`text-left ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2
          id="motion-controls-title"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          3D controls
        </h2>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <Toggle
          id="motion-orbit"
          label="Hero orbit"
          hint="Spin and drag the service ring"
          checked={settings.orbit}
          disabled={reduced}
          onChange={(orbit) => update({ orbit })}
        />
        <Toggle
          id="motion-tilt"
          label="Card tilt"
          hint="3D tilt and glow on service cards"
          checked={settings.tilt}
          disabled={reduced}
          onChange={(tilt) => update({ tilt })}
        />
        <Toggle
          id="motion-hover-preview"
          label="Hover preview"
          hint="Brief taster animation on hover when orbit or tilt is off"
          checked={settings.hoverPreview}
          disabled={reduced}
          onChange={(hoverPreview) => update({ hoverPreview })}
        />

        <div>
          <p className="text-sm font-medium text-card-foreground" id="orbit-preset-label">
            Orbit preset
          </p>
          <div
            role="radiogroup"
            aria-labelledby="orbit-preset-label"
            aria-keyshortcuts="ArrowLeft ArrowRight Home End"
            className="mt-2 flex gap-1 rounded-none border border-border/70 bg-background/60 p-1"
          >
            {orbitPresetList.map((p, i) => {
              const active = settings.orbitPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${p.label} orbit — ${p.hint}`}
                  // Roving tabindex: one tab stop for the whole group.
                  tabIndex={active ? 0 : -1}
                  disabled={reduced || !settings.orbit}
                  onClick={() => update({ orbitPreset: p.id })}
                  onKeyDown={(e) => {
                    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
                    if (!keys.includes(e.key)) return;
                    e.preventDefault();
                    const len = orbitPresetList.length;
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? len - 1
                          : e.key === "ArrowRight" || e.key === "ArrowDown"
                            ? (i + 1) % len
                            : (i - 1 + len) % len;
                    const target = orbitPresetList[next];
                    if (!target) return;
                    update({ orbitPreset: target.id });
                    const group = e.currentTarget.parentElement;
                    const btn = group?.children[next] as HTMLButtonElement | undefined;
                    btn?.focus();
                  }}
                  className={`flex-1 rounded-none px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 ${
                    active
                      ? "bg-accent/25 text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {(orbitPresets[settings.orbitPreset] ?? orbitPresets.normal).hint}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="motion-sensitivity"
              className="text-sm font-medium text-card-foreground"
            >
              Animation sensitivity
            </label>
            <span className="text-xs font-semibold text-accent" aria-hidden>
              {settings.sensitivity.toFixed(1)}×
            </span>
          </div>
          <input
            id="motion-sensitivity"
            type="range"
            min={0.4}
            max={1.6}
            step={0.1}
            value={settings.sensitivity}
            disabled={reduced}
            aria-valuetext={`${settings.sensitivity.toFixed(1)} times`}
            onChange={(e) => update({ sensitivity: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--accent)] disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {reduced
              ? "Motion is off — switch quality above Reduced to enable."
              : "Lower is subtle, higher is dramatic."}
          </p>
        </div>

        <MotionQualitySetting className="border-t border-border/60 pt-4" />

        <FocusRingSetting className="border-t border-border/60 pt-4" />
      </div>
    </section>
  );
}
