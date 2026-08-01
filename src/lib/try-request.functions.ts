import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Only the deployed capstone services may be called through this proxy.
const ALLOWED_HOSTS = [
  "azure-openai-kujc.onrender.com",
  "azure-rag-1.onrender.com",
  "azure-speech-a8kp.onrender.com",
  "azure-vision.netlify.app",
  "azure-language.netlify.app",
];

const Input = z.object({
  endpoint: z.string().url(),
  payload: z.record(z.string(), z.unknown()),
});

export type TryRequestResult = {
  ok: boolean;
  status: number;
  durationMs: number;
  /** Raw response text; parse as JSON on the client when possible. */
  bodyText: string;
  error: string | null;
};

/**
 * Calls a deployed service from the server so the browser never hits CORS,
 * and returns the parsed JSON (or raw text) response for display in the modal.
 */
export const tryServiceRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<TryRequestResult> => {
    const url = new URL(data.endpoint);
    if (!ALLOWED_HOSTS.includes(url.hostname)) {
      return {
        ok: false,
        status: 0,
        durationMs: 0,
        bodyText: "",
        error: `Endpoint host ${url.hostname} is not an allowed capstone service.`,
      };
    }

    const started = Date.now();
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data.payload),
        signal: AbortSignal.timeout(20_000),
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        durationMs: Date.now() - started,
        bodyText: text,
        error: null,
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        durationMs: Date.now() - started,
        bodyText: "",
        error: err instanceof Error ? err.message : "Request failed",
      };
    }
  });
