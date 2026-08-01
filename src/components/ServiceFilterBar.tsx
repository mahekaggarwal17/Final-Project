import type { Service } from "./ServiceGrid";

export type Category = { id: string; label: string };

export const categories: Category[] = [
  { id: "openai", label: "OpenAI" },
  { id: "rag", label: "RAG" },
  { id: "speech", label: "Speech" },
  { id: "vision", label: "Vision" },
  { id: "language", label: "Language" },
];

export function matchesService(s: Service, query: string, active: string[]) {
  if (active.length && !active.includes(s.id)) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    s.name,
    s.azure,
    s.blurb,
    s.detail,
    ...s.capabilities,
    ...s.pipeline,
    ...s.examples.flatMap((e) => [e.label, e.input, e.output]),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  active: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  resultCount: number;
};

export function ServiceFilterBar({
  query,
  onQueryChange,
  active,
  onToggle,
  onReset,
  resultCount,
}: Props) {
  const hasFilters = query.trim().length > 0 || active.length > 0;

  return (
    <section
      aria-labelledby="service-filter-heading"
      className="mb-8 rounded-none border border-border/60 bg-card/50 p-5 backdrop-blur"
    >
      <h3 id="service-filter-heading" className="sr-only">
        Search and filter Azure AI services
      </h3>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            ⌕
          </span>
          <input
            id="service-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name, capability or keyword…"
            aria-label="Search services by name, capability or keyword"
            aria-describedby="service-filter-status"
            className="w-full rounded-none border border-border/70 bg-background/70 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by Azure AI capability"
          className="flex flex-wrap items-center gap-2"
        >
          {categories.map((c) => {
            const pressed = active.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggle(c.id)}
                aria-pressed={pressed}
                className={`chip cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  pressed
                    ? "border-accent/70 bg-accent/15 text-accent"
                    : "hover:border-accent/50 hover:text-accent"
                }`}
              >
                {c.label}
              </button>
            );
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <p
        id="service-filter-status"
        aria-live="polite"
        className="mt-4 text-xs text-muted-foreground"
      >
        {resultCount} {resultCount === 1 ? "service" : "services"} match
        {hasFilters ? " your search" : "es the current view"}.
      </p>
    </section>
  );
}
