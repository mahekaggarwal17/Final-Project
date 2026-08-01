import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  auditDocument,
  severityCopy,
  severityOrder,
  type AuditResult,
  type Finding,
  type Severity,
} from "@/lib/a11y-audit";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Checklist — Azure AI Capstone" },
      {
        name: "description",
        content:
          "Live in-app accessibility audit for the Azure AI capstone: scans every route for missing ARIA labels, focus-trap problems and structure issues, with a fix for each finding.",
      },
      { property: "og:title", content: "Accessibility Checklist — Azure AI Capstone" },
      {
        property: "og:description",
        content:
          "Scan the capstone hub and demo routes for missing ARIA labels and focus-trap issues, and see the exact fix for each finding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccessibilityPage,
});

const TARGETS = [
  { path: "/", label: "Capstone hub (home)" },
  { path: "/demo/azure-openai", label: "Demo module (embedded service)" },
  { path: "/accessibility", label: "This checklist page" },
];

type ScanState = {
  status: "idle" | "running" | "done" | "error";
  target: string;
  result: AuditResult | null;
  message: string;
};

function severityTone(s: Severity) {
  if (s === "critical") return "border-destructive/60 bg-destructive/10 text-destructive";
  if (s === "warning") return "border-primary/50 bg-primary/10 text-primary";
  return "border-border bg-muted/40 text-muted-foreground";
}

function FindingCard({ finding }: { finding: Finding }) {
  const copy = severityCopy[finding.severity];
  return (
    <li className="rounded-none border border-border/70 bg-card/70 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-none border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${severityTone(
            finding.severity,
          )}`}
        >
          {copy.label}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {finding.rule}
        </span>
      </div>
      <p className="mt-3 text-sm text-card-foreground">{finding.problem}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-semibold text-accent">Fix: </span>
        {finding.fix}
      </p>
      <p className="mt-3 text-xs font-medium text-muted-foreground">
        Element: <code className="rounded bg-background/70 px-1.5 py-0.5">{finding.element}</code>
      </p>
      <pre className="mt-2 max-h-28 overflow-auto rounded-none bg-background/70 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
        <code>{finding.snippet}</code>
      </pre>
    </li>
  );
}

function AccessibilityPage() {
  const [scan, setScan] = useState<ScanState>({
    status: "idle",
    target: TARGETS[0]!.path,
    result: null,
    message: "",
  });
  const [target, setTarget] = useState(TARGETS[0]!.path);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const run = useCallback((path: string) => {
    setScan({ status: "running", target: path, result: null, message: "" });

    // Same-origin route rendered offscreen, then audited from its own document.
    const frame = document.createElement("iframe");
    frame.title = `Accessibility scan sandbox for ${path}`;
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1280px;height:1400px;border:0;visibility:hidden;";
    frameRef.current?.remove();
    frameRef.current = frame;

    const cleanup = () => {
      frame.remove();
      if (frameRef.current === frame) frameRef.current = null;
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      setScan({
        status: "error",
        target: path,
        result: null,
        message: "The route took too long to render. Try running the scan again.",
      });
    }, 12000);

    frame.addEventListener("load", () => {
      // Give the route a beat to hydrate and mount deferred UI.
      window.setTimeout(() => {
        try {
          const doc = frame.contentDocument;
          if (!doc) throw new Error("no document");
          const result = auditDocument(doc);
          setScan({ status: "done", target: path, result, message: "" });
        } catch {
          setScan({
            status: "error",
            target: path,
            result: null,
            message: "Could not read that route's document. Scanning this page instead works too.",
          });
        } finally {
          window.clearTimeout(timeout);
          cleanup();
        }
      }, 1400);
    });

    frame.src = path;
    document.body.appendChild(frame);
  }, []);

  useEffect(() => {
    run(TARGETS[0]!.path);
    return () => {
      frameRef.current?.remove();
      frameRef.current = null;
    };
  }, [run]);

  const result = scan.result;
  const counts = severityOrder.map((s) => ({
    severity: s,
    count: result ? result.findings.filter((f) => f.severity === s).length : 0,
  }));
  const targetLabel = TARGETS.find((t) => t.path === scan.target)?.label ?? scan.target;

  const summary =
    scan.status === "running"
      ? `Scanning ${targetLabel} for accessibility issues…`
      : scan.status === "error"
        ? `Scan failed: ${scan.message}`
        : result
          ? `${targetLabel}: ${result.findings.length} issue${
              result.findings.length === 1 ? "" : "s"
            } found across ${result.checked} checked elements. ${counts
              .map((c) => `${c.count} ${severityCopy[c.severity].label.toLowerCase()}`)
              .join(", ")}.`
          : "";

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-28 pt-14 md:pt-20">
      <p className="eyebrow">Accessibility</p>
      <h1 className="mt-4 font-display text-[2.2rem] font-bold leading-[1.05] tracking-tight md:text-5xl">
        <span className="text-aurora">Accessibility checklist</span>
      </h1>
      <div className="gold-rule mt-6 max-w-xs" />
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
        This page renders a route offscreen and audits its real DOM for missing ARIA labels,
        focus-trap problems, and structural issues — then shows the exact fix for each finding. Open
        a service modal or the walkthrough on the home page first if you want those states included.
      </p>

      <div className="mt-8 flex flex-wrap items-end gap-3 rounded-none border border-border/70 bg-card/70 p-5">
        <div className="min-w-56 flex-1">
          <label
            htmlFor="a11y-target"
            className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Route to scan
          </label>
          <select
            id="a11y-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-2 w-full rounded-none border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground"
          >
            {TARGETS.map((t) => (
              <option key={t.path} value={t.path}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => run(target)}
          disabled={scan.status === "running"}
          aria-label={`Run the accessibility scan on ${
            TARGETS.find((t) => t.path === target)?.label ?? target
          }`}
          className="gold-cta disabled:opacity-60"
        >
          {scan.status === "running" ? "Scanning…" : "Run scan"}
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {summary}
      </p>

      {scan.status === "running" && (
        <div className="mt-8 space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-none border border-border/70 bg-card/50"
            />
          ))}
        </div>
      )}

      {scan.status === "error" && (
        <p className="mt-8 rounded-none border border-destructive/50 bg-destructive/10 p-5 text-sm text-destructive">
          {scan.message}
        </p>
      )}

      {scan.status === "done" && result && (
        <>
          <section aria-label="Scan summary" className="mt-9">
            <dl className="grid gap-4 sm:grid-cols-4">
              {counts.map((c) => (
                <div
                  key={c.severity}
                  className="rounded-none border border-border/70 bg-card/70 p-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {severityCopy[c.severity].label}
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-bold text-foreground">
                    {c.count}
                  </dd>
                  <dd className="mt-1 text-xs text-muted-foreground">
                    {severityCopy[c.severity].blurb}
                  </dd>
                </div>
              ))}
              <div className="rounded-none border border-border/70 bg-card/70 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Elements checked
                </dt>
                <dd className="mt-2 font-display text-3xl font-bold text-foreground">
                  {result.checked}
                </dd>
                <dd className="mt-1 text-xs text-muted-foreground">on {targetLabel}</dd>
              </div>
            </dl>
          </section>

          {result.findings.length === 0 ? (
            <p className="mt-8 rounded-none border border-primary/40 bg-primary/10 p-5 text-sm text-foreground">
              No issues found on {targetLabel}. Every ARIA-label and focus-trap check passed.
            </p>
          ) : (
            severityOrder.map((severity) => {
              const items = result.findings.filter((f) => f.severity === severity);
              if (items.length === 0) return null;
              return (
                <section key={severity} aria-labelledby={`a11y-${severity}`} className="mt-10">
                  <h2
                    id={`a11y-${severity}`}
                    className="text-sm font-semibold uppercase tracking-[0.18em] text-accent"
                  >
                    {severityCopy[severity].label} · {items.length}
                  </h2>
                  <ul className="mt-4 grid list-none gap-4 p-0">
                    {items.map((f, i) => (
                      <FindingCard key={`${f.ruleId}-${f.element}-${i}`} finding={f} />
                    ))}
                  </ul>
                </section>
              );
            })
          )}

          {result.passedRules.length > 0 && (
            <section aria-labelledby="a11y-passed" className="mt-10">
              <h2
                id="a11y-passed"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-accent"
              >
                Passing checks · {result.passedRules.length}
              </h2>
              <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
                {result.passedRules.map((r) => (
                  <li
                    key={r}
                    className="rounded-none border border-border/70 bg-card/50 px-4 py-2.5 text-sm text-muted-foreground"
                  >
                    <span aria-hidden className="mr-2 text-primary">
                      ✓
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="mt-12 text-sm">
        <Link to="/" className="ghost-cta">
          <span aria-hidden className="arrow">
            ←
          </span>
          Back to the capstone hub
        </Link>
      </p>
    </main>
  );
}

export default AccessibilityPage;
