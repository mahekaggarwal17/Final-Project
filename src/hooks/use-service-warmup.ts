import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type NetInfo = { saveData?: boolean; effectiveType?: string };

/** Skip speculative work on metered or very slow connections. */
function shouldSkip(): boolean {
  const net = (navigator as Navigator & { connection?: NetInfo }).connection;
  if (!net) return false;
  return Boolean(net.saveData) || net.effectiveType === "slow-2g" || net.effectiveType === "2g";
}

/** Run after the current interaction settles, so hover/focus stays smooth. */
function onIdle(fn: () => void): () => void {
  const w = window as IdleWindow;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout: 400 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 120);
  return () => window.clearTimeout(id);
}

/**
 * Warms a /demo/<id> route on hover, touch or keyboard focus.
 *
 * Guarantees, in order of why they matter here:
 * - never re-renders: all state lives in refs, so warming a card can't
 *   invalidate the grid mid-hover;
 * - never shifts layout: the only DOM it writes is `<link>` in `<head>`, which
 *   is not rendered, and each origin is added once;
 * - fires reliably: pointer enter covers mouse/pen, touchstart covers taps
 *   that skip hover, and focus covers keyboard tabbing;
 * - stays cheap: work is deduped per id and deferred to idle time, and skipped
 *   entirely on save-data / 2g connections.
 */
export function useServiceWarmup() {
  const router = useRouter();
  const warmed = useRef(new Set<string>());
  const cancels = useRef(new Set<() => void>());

  useEffect(
    () => () => {
      cancels.current.forEach((cancel) => cancel());
      cancels.current.clear();
    },
    [],
  );

  const warm = useCallback(
    (id: string, url: string) => {
      if (warmed.current.has(id)) return;
      // Mark immediately: repeated pointerenter/focus must never queue twice.
      warmed.current.add(id);
      if (shouldSkip()) return;

      const cancel = onIdle(() => {
        cancels.current.delete(cancel);
        void router.preloadRoute({ to: "/demo/$serviceId", params: { serviceId: id } });

        try {
          const origin = new URL(url, window.location.href).origin;
          if (origin === window.location.origin) return;
          if (document.head.querySelector(`link[data-warm="${origin}"]`)) return;
          for (const rel of ["preconnect", "dns-prefetch"]) {
            const link = document.createElement("link");
            link.rel = rel;
            link.href = origin;
            if (rel === "preconnect") link.crossOrigin = "";
            link.dataset["warm"] = origin;
            document.head.appendChild(link);
          }
        } catch {
          /* non-absolute url — nothing to preconnect */
        }
      });
      cancels.current.add(cancel);
    },
    [router],
  );

  /** Spread onto a card wrapper to cover mouse, touch and keyboard entry. */
  const warmProps = useCallback(
    (id: string, url: string) => ({
      onPointerEnter: () => warm(id, url),
      onTouchStart: () => warm(id, url),
      onFocusCapture: () => warm(id, url),
    }),
    [warm],
  );

  return { warm, warmProps, isWarm: (id: string) => warmed.current.has(id) };
}
