import { FOCUS_MAX, FOCUS_MIN, focusRingStyleOptions, useFocusRing } from "@/hooks/use-focus-ring";

/**
 * Lets keyboard users pick a focus outline style and thickness so the ring stays
 * visible during the walkthrough and over the 3D surfaces.
 */
export function FocusRingSetting({ className = "" }: { className?: string }) {
  const { settings, update, reset } = useFocusRing();
  const active = focusRingStyleOptions.find((o) => o.id === settings.style);

  return (
    <section aria-labelledby="focus-ring-title" className={className}>
      <div className="flex items-center justify-between gap-3">
        <h3 id="focus-ring-title" className="text-sm font-medium text-card-foreground">
          Focus outline
        </h3>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset the focus outline to solid, 2 pixels"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Reset
        </button>
      </div>

      {/* Visual preview of the current focus ring style and thickness. */}
      <div
        aria-hidden="true"
        className="mt-3 flex items-center justify-center gap-4 border border-border/70 bg-sand p-4"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="focus-ring-preview inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-card-foreground">
            Focus target
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preview
          </span>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="focus-ring-title"
        aria-keyshortcuts="ArrowLeft ArrowRight Home End"
        className="mt-2 grid grid-cols-2 gap-1 rounded-none border border-border/70 bg-background/60 p-1 sm:grid-cols-4"
      >
        {focusRingStyleOptions.map((option, i) => {
          const checked = settings.style === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${option.label} focus outline — ${option.hint}`}
              tabIndex={checked ? 0 : -1}
              onClick={() => update({ style: option.id })}
              onKeyDown={(e) => {
                const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
                if (!keys.includes(e.key)) return;
                e.preventDefault();
                const len = focusRingStyleOptions.length;
                const nextIndex =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? len - 1
                      : e.key === "ArrowRight" || e.key === "ArrowDown"
                        ? (i + 1) % len
                        : (i - 1 + len) % len;
                const target = focusRingStyleOptions[nextIndex];
                if (!target) return;
                update({ style: target.id });
                const group = e.currentTarget.parentElement;
                (group?.children[nextIndex] as HTMLButtonElement | undefined)?.focus();
              }}
              className={`rounded-none px-2 py-1.5 text-xs font-semibold transition-colors ${
                checked ? "bg-accent/25 text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label htmlFor="focus-ring-thickness" className="text-sm text-card-foreground">
          Thickness
        </label>
        <span className="text-xs font-semibold text-accent" aria-hidden>
          {settings.thickness}px
        </span>
      </div>
      <input
        id="focus-ring-thickness"
        type="range"
        min={FOCUS_MIN}
        max={FOCUS_MAX}
        step={1}
        value={settings.thickness}
        aria-label="Focus outline thickness in pixels"
        aria-valuetext={`${settings.thickness} pixels`}
        onChange={(e) => update({ thickness: Number(e.target.value) })}
        className="mt-2 w-full accent-[var(--accent)]"
      />

      <p className="mt-1 text-xs text-muted-foreground">
        {active?.hint} Applies everywhere, including the guided walkthrough.
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {`Focus outline: ${active?.label ?? "Solid"}, ${settings.thickness} pixels.`}
      </p>
    </section>
  );
}

export default FocusRingSetting;
