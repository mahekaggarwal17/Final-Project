import { useEffect, useId, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { CodeBlock } from "./CodeBlock";
import { TryRequestButton } from "./TryRequestButton";
import { BaseUrlSelector, joinBase, splitEndpoint, useBaseUrl } from "./BaseUrlSelector";
import { ServiceDialogSkeleton } from "./ServiceDialogSkeleton";
import type { Service, ServiceExample } from "./ServiceGrid";

type ServiceDialogProps = {
  service: Service | null;
  onClose: () => void;
};

function jsonBody(example: ServiceExample) {
  return JSON.stringify(example.payload, null, 2);
}

function curlCommand(endpoint: string, example: ServiceExample) {
  return [
    `curl -X POST "${endpoint}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Authorization: Bearer $AZURE_API_KEY" \\`,
    `  -d '${jsonBody(example)}'`,
  ].join("\n");
}

const TABS = ["curl", "json", "response"] as const;
type TabId = (typeof TABS)[number];

const TAB_LABEL: Record<TabId, string> = {
  curl: "cURL",
  json: "JSON",
  response: "Response",
};

function ExampleSnippets({
  endpoint,
  canTryLive,
  example,
  serviceName,
}: {
  endpoint: string;
  canTryLive: boolean;
  example: ServiceExample;
  serviceName: string;
}) {
  const [tab, setTab] = useState<TabId>("curl");
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = (id: TabId) => {
    setTab(id);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tab-id="${id}"]`)
        ?.focus();
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.indexOf(tab);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(TABS[(index + 1) % TABS.length]!);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(TABS[(index - 1 + TABS.length) % TABS.length]!);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(TABS[0]!);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(TABS[TABS.length - 1]!);
    }
  };

  const code =
    tab === "curl"
      ? curlCommand(endpoint, example)
      : tab === "json"
        ? jsonBody(example)
        : JSON.stringify(example.response, null, 2);
  const codeLabel =
    tab === "curl"
      ? "Request — cURL"
      : tab === "json"
        ? "Request body — JSON"
        : "Expected response — JSON";

  return (
    <div className="mt-4">
      <div
        ref={listRef}
        role="tablist"
        aria-label={`Request format for the ${example.label} example of ${serviceName}`}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex w-fit items-center gap-1 rounded-none border bg-background/50 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`${baseId}-tab-${t}`}
            data-tab-id={t}
            aria-selected={tab === t}
            aria-controls={`${baseId}-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            className={`min-h-9 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              tab === t
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${tab}`}
        aria-labelledby={`${baseId}-tab-${tab}`}
        tabIndex={0}
        className="rounded-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <CodeBlock
          label={codeLabel}
          code={code}
          copyLabel={`Copy ${TAB_LABEL[tab]} request for the ${example.label} example of ${serviceName}`}
        />
      </div>
      {canTryLive ? (
        <TryRequestButton
          endpoint={endpoint}
          payload={example.payload}
          label={example.label}
          serviceName={serviceName}
        />
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Switch the base URL back to “Deployed” to run this request live.
        </p>
      )}
    </div>
  );
}

function ExamplesSection({ service }: { service: Service }) {
  const { base: deployedBase, path } = splitEndpoint(service.endpoint);
  const { base, setBase, isDeployed } = useBaseUrl(service.id, deployedBase);

  return (
    <section aria-labelledby={`${service.id}-examples`}>
      <h4
        id={`${service.id}-examples`}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Example inputs, outputs and requests
      </h4>
      <BaseUrlSelector
        serviceName={service.name}
        deployedBase={deployedBase}
        base={base}
        onChange={setBase}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Endpoint{" "}
        <code className="font-mono text-accent">POST {joinBase(base, path)}</code>
      </p>
      <ul className="mt-3 grid list-none gap-3 p-0">
        {service.examples.map((ex) => (
          <li
            key={ex.label}
            className="rounded-none border bg-secondary/40 p-4"
            aria-label={`${ex.label} example`}
          >
            <p className="text-sm font-semibold text-card-foreground">{ex.label}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Input
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{ex.input}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Output
            </p>
            <p className="mt-1 whitespace-pre-line font-mono text-sm leading-relaxed text-card-foreground">
              {ex.output}
            </p>
            <ExampleSnippets
              endpoint={joinBase(base, path)}
              canTryLive={isDeployed}
              example={ex}
              serviceName={service.name}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}



export function ServiceDialog({ service, onClose }: ServiceDialogProps) {
  // The modal shows skeletons until its content is mounted and measurable, so
  // sighted users never see a blank sheet and screen readers get one clear
  // "loading" -> "ready" announcement instead of a half-built dialog.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!service) {
      setReady(false);
      return;
    }
    setReady(false);
    let raf = 0;
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(() => setReady(true));
    }, 120);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [service]);

  return (
    <Dialog open={service !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {service && (
          <>
            <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {ready
                ? `${service.name} details ready. Description, capabilities, pipeline and example requests are available.`
                : `Loading ${service.name} details\u2026`}
            </p>

            {!ready && (
              <>
                {/* Keeps the dialog labelled while the real header is loading. */}
                <DialogTitle className="sr-only">Loading {service.name} details</DialogTitle>
                <DialogDescription className="sr-only">
                  Please wait while the {service.name} description, capabilities and example
                  requests load.
                </DialogDescription>
                <ServiceDialogSkeleton />
              </>
            )}

            <div hidden={!ready} className="flex flex-col gap-4">
            <DialogHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {service.glyph} · {service.azure}
              </p>
              <DialogTitle className="font-display text-2xl">{service.name}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {service.detail}
              </DialogDescription>
            </DialogHeader>

            <ul className="flex flex-wrap gap-2" aria-label={`${service.name} capabilities`}>
              {service.capabilities.map((c) => (
                <li key={c} className="chip">
                  {c}
                </li>
              ))}
            </ul>

            <section aria-labelledby={`${service.id}-how`}>
              <h4
                id={`${service.id}-how`}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                How it works
              </h4>
              <ol className="flow mt-3">
                {service.pipeline.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <ExamplesSection service={service} />

            <Link
              to="/demo/$serviceId"
              params={{ serviceId: service.id }}
              className="link-cta mt-2 self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={onClose}
              aria-label={`Open the live ${service.name} module`}
            >
              Open the live module
              <span aria-hidden className="arrow">
                →
              </span>
            </Link>
            </div>

          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
