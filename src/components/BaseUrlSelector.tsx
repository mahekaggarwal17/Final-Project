import { useCallback, useEffect, useId, useState } from "react";

export const LOCAL_BASE = "http://localhost:8000";

/** Splits a full endpoint into its origin (base) and path. */
export function splitEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return { base: url.origin, path: `${url.pathname}${url.search}` };
  } catch {
    return { base: "", path: endpoint };
  }
}

/** Joins a chosen base URL with an endpoint path, tolerating trailing slashes. */
export function joinBase(base: string, path: string) {
  const trimmedBase = base.trim().replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

const storageKey = (serviceId: string) => `capstone.baseUrl.${serviceId}`;

/**
 * Remembers the base URL (environment/host) a service's snippets should target.
 * Falls back to the deployed origin so first render always matches production.
 */
export function useBaseUrl(serviceId: string, deployedBase: string) {
  const [base, setBase] = useState(deployedBase);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey(serviceId));
    } catch {
      stored = null;
    }
    setBase(stored && stored.trim() ? stored : deployedBase);
  }, [serviceId, deployedBase]);

  const update = useCallback(
    (next: string) => {
      setBase(next);
      try {
        window.localStorage.setItem(storageKey(serviceId), next);
      } catch {
        /* storage unavailable — keep in-memory only */
      }
    },
    [serviceId],
  );

  return { base, setBase: update, isDeployed: base.replace(/\/+$/, "") === deployedBase };
}

type Mode = "deployed" | "local" | "custom";

export function BaseUrlSelector({
  serviceName,
  deployedBase,
  base,
  onChange,
}: {
  serviceName: string;
  deployedBase: string;
  base: string;
  onChange: (base: string) => void;
}) {
  const id = useId();
  const mode: Mode =
    base.replace(/\/+$/, "") === deployedBase
      ? "deployed"
      : base.replace(/\/+$/, "") === LOCAL_BASE
        ? "local"
        : "custom";

  const options: { id: Mode; label: string; value: string }[] = [
    { id: "deployed", label: "Deployed", value: deployedBase },
    { id: "local", label: "Local dev", value: LOCAL_BASE },
    { id: "custom", label: "Custom", value: "" },
  ];

  return (
    <div className="mt-3 rounded-none border bg-background/40 p-3">
      <p
        id={`${id}-label`}
        className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >
        Base URL
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-label={`Base URL environment for ${serviceName}`}
        className="mt-2 flex flex-wrap items-center gap-1"
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={mode === option.id}
            onClick={() => {
              if (option.id === "custom") {
                onChange(mode === "custom" ? base : "https://");
              } else {
                onChange(option.value);
              }
            }}
            className={`min-h-9 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              mode === option.id
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {mode === "custom" && (
        <input
          type="url"
          value={base}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://my-host.example.com"
          aria-label={`Custom base URL for ${serviceName}`}
          className="mt-2 w-full rounded-none border bg-background/60 px-2.5 py-2 font-mono text-xs text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Snippets below target{" "}
        <code className="font-mono text-accent">{base.replace(/\/+$/, "") || "—"}</code>
        {mode !== "deployed" && ". Live “Try this request” calls only work against the deployed host."}
      </p>
    </div>
  );
}
