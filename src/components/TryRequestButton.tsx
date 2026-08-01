import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { tryServiceRequest, type TryRequestResult } from "@/lib/try-request.functions";
import { CodeBlock } from "./CodeBlock";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  endpoint: string;
  payload: Record<string, unknown>;
  label: string;
  serviceName: string;
};

function pretty(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function TryRequestButton({ endpoint, payload, label, serviceName }: Props) {
  const run = useServerFn(tryServiceRequest);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryRequestResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const onClick = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await run({ data: { endpoint, payload } });
      setResult(res);
    } catch (err) {
      setResult({
        ok: false,
        status: 0,
        durationMs: 0,
        bodyText: "",
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(false);
      requestAnimationFrame(() => resultRef.current?.focus());
    }
  };

  const body = result?.bodyText ? pretty(result.bodyText) : "";

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label={`Send the ${label} request to the live ${serviceName} service`}
        className="inline-flex min-h-9 items-center gap-2 rounded-none border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent/20 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {loading ? "Sending…" : "Try this request"}
        <span aria-hidden>{loading ? "⋯" : "→"}</span>
      </button>

      <p className="sr-only" role="status" aria-live="polite">
        {loading
          ? `Sending the ${label} request to ${serviceName}`
          : result
            ? `${serviceName} responded with status ${result.status || "no response"} in ${result.durationMs} milliseconds`
            : ""}
      </p>

      {loading && (
        <div aria-hidden className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-none" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-24 w-full rounded-none" />
        </div>
      )}

      {!loading && result && (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="mt-3 rounded-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 font-semibold ${
                result.ok
                  ? "border-accent/40 text-accent"
                  : "border-destructive/40 text-destructive"
              }`}
            >
              {result.status ? `HTTP ${result.status}` : "No response"}
            </span>
            <span>{result.durationMs} ms</span>
          </p>
          {result.error ? (
            <p className="mt-2 text-sm text-destructive">{result.error}</p>
          ) : (
            <CodeBlock
              label="Response — JSON"
              code={body || "(empty response body)"}
              copyLabel={`Copy the ${serviceName} response for the ${label} example`}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default TryRequestButton;
