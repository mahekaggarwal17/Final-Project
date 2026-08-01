import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

type CodeBlockProps = {
  label: string;
  code: string;
  copyLabel?: string;
};

export function CodeBlock({ label, code, copyLabel }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!copied && !error) return;
    const t = window.setTimeout(() => {
      setCopied(false);
      setError(false);
    }, 1600);
    return () => window.clearTimeout(t);
  }, [copied, error]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
    } catch {
      setCopied(false);
      setError(true);
    }
  };

  return (
    <div className="mt-3 overflow-hidden rounded-none border bg-background/60">
      <div className="flex items-center justify-between gap-3 border-b bg-secondary/40 px-3 py-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-none px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={copyLabel ?? `Copy ${label} to clipboard`}
        >
          {copied ? (
            <Check aria-hidden className="size-3.5" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${label} copied to clipboard` : error ? `Could not copy ${label}` : ""}
      </span>
      <pre
        tabIndex={0}
        aria-label={label}
        className="max-h-56 overflow-auto px-3 py-3 text-xs leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <code className="font-mono text-card-foreground">{code}</code>
      </pre>
    </div>
  );
}
