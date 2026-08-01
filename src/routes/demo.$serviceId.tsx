import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { services, type Service } from "@/components/ServiceGrid";

export const Route = createFileRoute("/demo/$serviceId")({
  loader: ({ params }) => {
    const service = services.find((s) => s.id === params.serviceId);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.service.name ?? "Demo";
    const azure = loaderData?.service.azure ?? "Azure AI";
    const title = `${name} — ${azure} demo`;
    const description = loaderData?.service.blurb ?? "Live Azure AI demo module.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DemoPage,
});

function DemoPage() {
  const { service } = Route.useLoaderData() as { service: Service };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-sm font-medium text-accent hover:underline">
            ← Back to the hub
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {service.glyph} · {service.azure}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{service.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {service.detail}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {service.capabilities.map((c) => (
            <li key={c} className="chip">
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 overflow-hidden rounded-none border-2 border-ink tint-sand shadow-[var(--shadow-glow)]">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-none bg-accent" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Running inside the capstone hub
          </p>
        </div>
        <iframe
          title={`${service.name} live module`}
          src={service.url}
          className="h-[75vh] w-full border-0 bg-background"
          allow="microphone; camera; clipboard-write"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Example inputs and outputs
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {service.examples.map((ex) => (
            <div key={ex.label} className="rounded-none border-2 border-ink tint-mint p-4">
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
            </div>
          ))}
        </div>
      </section>

      <nav className="mt-12 flex flex-wrap gap-3 border-t pt-8">
        {services
          .filter((s) => s.id !== service.id)
          .map((s) => (
            <Link
              key={s.id}
              to="/demo/$serviceId"
              params={{ serviceId: s.id }}
              className="chip hover:border-accent"
            >
              {s.glyph} {s.name}
            </Link>
          ))}
      </nav>
    </main>
  );
}
