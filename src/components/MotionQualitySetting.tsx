import { motionQualityOptions, useMotionQuality } from "@/hooks/use-motion-profile";

/**
 * Three-way motion-quality switch. The active value is remembered per device;
 * "Auto" resets to the detected preference.
 */
export function MotionQualitySetting({ className = "" }: { className?: string }) {
  const { quality, auto, systemReduced, setQuality, resetQuality } = useMotionQuality();
  const active = motionQualityOptions.find((o) => o.id === quality);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <p
          id="motion-quality-label"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          3D motion quality
        </p>
        {!auto && !systemReduced && (
          <button
            type="button"
            onClick={resetQuality}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Auto
          </button>
        )}
      </div>

      <div
        role="radiogroup"
        aria-labelledby="motion-quality-label"
        aria-describedby="motion-quality-hint"
        className="mt-2 inline-flex rounded-none border border-border/70 bg-background/60 p-1"
      >
        {motionQualityOptions.map((o) => {
          const selected = o.id === quality;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={systemReduced}
              aria-label={`${o.label} — ${o.hint}`}
              onClick={() => setQuality(o.id)}
              className={`rounded-none px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <p id="motion-quality-hint" aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {systemReduced
          ? "Your system requests reduced motion — inertia and tilt are off."
          : `${active?.hint ?? ""}${auto ? " · auto-detected for this device" : ""}`}
      </p>
    </div>
  );
}
