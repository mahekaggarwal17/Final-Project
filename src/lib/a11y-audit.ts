export type Severity = "critical" | "warning" | "info";

export type Finding = {
  ruleId: string;
  rule: string;
  severity: Severity;
  /** What is wrong, in plain language */
  problem: string;
  /** How to fix it */
  fix: string;
  /** Short CSS-ish path to the offending element */
  element: string;
  /** Trimmed outer HTML snippet */
  snippet: string;
};

export type AuditResult = {
  findings: Finding[];
  checked: number;
  passedRules: string[];
};

/* ---------- helpers ---------- */

const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

function describe(el: Element): string {
  const parts: string[] = [el.tagName.toLowerCase()];
  if (el.id) parts.push(`#${el.id}`);
  const cls = (el.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (cls.length) parts.push(`.${cls.join(".")}`);
  const role = el.getAttribute("role");
  if (role) parts.push(`[role="${role}"]`);
  return parts.join("");
}

function snippetOf(el: Element): string {
  const html = el.outerHTML.replace(/\s+/g, " ").trim();
  return html.length > 200 ? `${html.slice(0, 200)}…` : html;
}

function accessibleName(el: Element): string {
  const aria = el.getAttribute("aria-label");
  if (aria && aria.trim()) return aria.trim();
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const text = labelledby
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }
  // Tag checks, not instanceof: elements audited inside an iframe belong to a
  // different realm, so instanceof HTMLInputElement is false there.
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    const field = el as HTMLInputElement;
    const labels = field.labels ? Array.from(field.labels) : [];
    if (labels.length) {
      const t = labels
        .map((l) => l.textContent ?? "")
        .join(" ")
        .trim();
      if (t) return t;
    }
    if (el.id) {
      const explicit = el.ownerDocument.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      const t = (explicit?.textContent ?? "").trim();
      if (t) return t;
    }
    const wrapping = el.closest("label");
    const wrapped = (wrapping?.textContent ?? "").trim();
    if (wrapped) return wrapped;
    if (el.getAttribute("title")?.trim()) return el.getAttribute("title")!.trim();
  }
  if (tag === "img") return (el.getAttribute("alt") ?? "").trim();
  const title = el.getAttribute("title");
  if (title && title.trim()) return title.trim();
  // Visible text, ignoring aria-hidden decorations.
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden="true"], [aria-hidden=""]').forEach((n) => n.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

function isVisible(el: Element): boolean {
  const win = el.ownerDocument.defaultView;
  if (!win) return true;
  const style = win.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const r = el.getBoundingClientRect();
  // sr-only elements are 1px — still count them as present.
  return r.width > 0 || r.height > 0;
}

/* ---------- the audit ---------- */

/**
 * Runs a set of DOM-level accessibility checks focused on ARIA labelling and
 * focus-trap correctness. Pure DOM in / findings out, so it works on the live
 * document or on an offscreen same-origin iframe document.
 */
export function auditDocument(doc: Document): AuditResult {
  const findings: Finding[] = [];
  const ranRules = new Map<string, { rule: string; hits: number }>();

  const add = (f: Finding) => {
    findings.push(f);
    const entry = ranRules.get(f.ruleId);
    if (entry) entry.hits += 1;
  };
  const rule = (ruleId: string, name: string) => {
    ranRules.set(ruleId, { rule: name, hits: 0 });
  };

  const root = doc.body;
  let checked = 0;

  /* --- ARIA labelling --- */

  rule("button-name", "Buttons have an accessible name");
  root.querySelectorAll("button, [role='button'], [role='switch'], [role='radio'], [role='tab']").forEach((el) => {
    checked += 1;
    if (el.getAttribute("aria-hidden") === "true" || !isVisible(el)) return;
    if (!accessibleName(el)) {
      add({
        ruleId: "button-name",
        rule: "Buttons have an accessible name",
        severity: "critical",
        problem: "Control has no text and no aria-label, so screen readers announce only \"button\".",
        fix: 'Add aria-label="…" describing the action, or include visible text inside the control.',
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("link-name", "Links have an accessible name");
  root.querySelectorAll("a[href], [role='link']").forEach((el) => {
    checked += 1;
    if (el.getAttribute("aria-hidden") === "true" || !isVisible(el)) return;
    if (!accessibleName(el)) {
      add({
        ruleId: "link-name",
        rule: "Links have an accessible name",
        severity: "critical",
        problem: "Link exposes no name (icon-only or image-only link).",
        fix: "Add aria-label to the link, or alt text to the image inside it.",
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("image-alt", "Images have alt text");
  root.querySelectorAll("img").forEach((el) => {
    checked += 1;
    if (!el.hasAttribute("alt")) {
      add({
        ruleId: "image-alt",
        rule: "Images have alt text",
        severity: "critical",
        problem: "Image has no alt attribute, so its content is unavailable to screen readers.",
        fix: 'Add alt="short description", or alt="" if the image is purely decorative.',
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("input-label", "Form fields are labelled");
  root.querySelectorAll("input, select, textarea").forEach((el) => {
    checked += 1;
    const type = (el as HTMLInputElement).type;
    if (type === "hidden") return;
    if (!accessibleName(el)) {
      add({
        ruleId: "input-label",
        rule: "Form fields are labelled",
        severity: "critical",
        problem: "Field has no <label for>, aria-label or aria-labelledby.",
        fix: "Add a <label htmlFor={id}> tied to the field id, or an aria-label when no visible label fits.",
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("iframe-title", "Iframes are titled");
  root.querySelectorAll("iframe").forEach((el) => {
    checked += 1;
    if (!el.getAttribute("title")?.trim() && !accessibleName(el)) {
      add({
        ruleId: "iframe-title",
        rule: "Iframes are titled",
        severity: "warning",
        problem: "Embedded frame has no title, so screen readers announce it as an unnamed frame.",
        fix: 'Add title="What the embedded page is" to the <iframe>.',
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("clickable-role", "Click handlers sit on real controls");
  root.querySelectorAll("div[onclick], span[onclick]").forEach((el) => {
    checked += 1;
    add({
      ruleId: "clickable-role",
      rule: "Click handlers sit on real controls",
      severity: "critical",
      problem: "A non-interactive element handles clicks, so it is unreachable by keyboard.",
      fix: "Use a <button>, or add role=\"button\", tabIndex={0} and an onKeyDown handler for Enter/Space.",
      element: describe(el),
      snippet: snippetOf(el),
    });
  });

  /* --- focus traps & dialogs --- */

  rule("aria-hidden-focusable", "Hidden regions contain no focusable elements");
  root.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
    checked += 1;
    const inner = el.querySelectorAll(FOCUSABLE);
    const reachable = Array.from(inner).filter((n) => !n.hasAttribute("disabled"));
    if (reachable.length) {
      add({
        ruleId: "aria-hidden-focusable",
        rule: "Hidden regions contain no focusable elements",
        severity: "critical",
        problem: `aria-hidden="true" wraps ${reachable.length} focusable element(s) — keyboard users can tab into content screen readers cannot see.`,
        fix: 'Move the focusable content outside the hidden wrapper, or add tabIndex={-1} / the inert attribute to it.',
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("dialog-trap", "Modal dialogs trap focus and are labelled");
  root.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open]').forEach((el) => {
    checked += 1;
    const modal = el.getAttribute("aria-modal") === "true" || el.tagName === "DIALOG";
    if (!modal) {
      add({
        ruleId: "dialog-trap",
        rule: "Modal dialogs trap focus and are labelled",
        severity: "warning",
        problem: "Dialog is missing aria-modal=\"true\", so assistive tech may keep reading the page behind it.",
        fix: 'Add aria-modal="true" and keep focus inside the dialog while it is open.',
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
    if (!accessibleName(el) && !el.getAttribute("aria-labelledby") && !el.getAttribute("aria-label")) {
      add({
        ruleId: "dialog-trap",
        rule: "Modal dialogs trap focus and are labelled",
        severity: "critical",
        problem: "Dialog has no accessible name, so screen readers announce it without context.",
        fix: "Point aria-labelledby at the dialog heading id, or add aria-label.",
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
    const focusables = Array.from(el.querySelectorAll(FOCUSABLE)).filter(
      (n) => !n.hasAttribute("disabled"),
    );
    if (focusables.length === 0) {
      add({
        ruleId: "dialog-trap",
        rule: "Modal dialogs trap focus and are labelled",
        severity: "critical",
        problem: "Open dialog has nothing focusable, so keyboard users are stranded with no way out.",
        fix: "Include a close button (or another focusable control) and move focus to it on open.",
        element: describe(el),
        snippet: snippetOf(el),
      });
    } else {
      const active = el.ownerDocument.activeElement;
      if (active && !el.contains(active) && active !== el.ownerDocument.body) {
        add({
          ruleId: "dialog-trap",
          rule: "Modal dialogs trap focus and are labelled",
          severity: "warning",
          problem: "Focus is currently outside the open dialog — the focus trap is not holding.",
          fix: "On open, focus the dialog's first control and intercept Tab / Shift+Tab to cycle inside it.",
          element: describe(el),
          snippet: snippetOf(el),
        });
      }
    }
    const hasEscapeControl = focusables.some((n) => {
      const name = accessibleName(n).toLowerCase();
      return /close|dismiss|skip|cancel|got it|done|finish/.test(name);
    });
    if (focusables.length > 0 && !hasEscapeControl) {
      add({
        ruleId: "dialog-trap",
        rule: "Modal dialogs trap focus and are labelled",
        severity: "warning",
        problem: "No obvious close / dismiss control inside the dialog.",
        fix: "Add a labelled close button and support Escape to dismiss.",
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  rule("positive-tabindex", "No positive tabindex values");
  root.querySelectorAll("[tabindex]").forEach((el) => {
    checked += 1;
    const value = Number(el.getAttribute("tabindex"));
    if (Number.isFinite(value) && value > 0) {
      add({
        ruleId: "positive-tabindex",
        rule: "No positive tabindex values",
        severity: "warning",
        problem: `tabindex="${value}" forces this element ahead of everything else in the tab order.`,
        fix: "Use tabIndex={0} (or nothing) and rely on DOM order; use tabIndex={-1} for roving-tabindex groups.",
        element: describe(el),
        snippet: snippetOf(el),
      });
    }
  });

  /* --- structure --- */

  rule("landmark-main", "Exactly one <main> landmark");
  const mains = root.querySelectorAll("main, [role='main']");
  checked += 1;
  if (mains.length === 0) {
    add({
      ruleId: "landmark-main",
      rule: "Exactly one <main> landmark",
      severity: "warning",
      problem: "The page has no <main> landmark, so skip-to-content navigation has no target.",
      fix: "Wrap the primary content of the route in a single <main> element.",
      element: "document",
      snippet: "<body>…</body>",
    });
  } else if (mains.length > 1) {
    add({
      ruleId: "landmark-main",
      rule: "Exactly one <main> landmark",
      severity: "warning",
      problem: `Found ${mains.length} <main> landmarks — only one is allowed per page.`,
      fix: "Keep one <main> in the layout that renders <Outlet /> and use <section> elsewhere.",
      element: "document",
      snippet: "<body>…</body>",
    });
  }

  rule("heading-order", "Heading levels never skip");
  const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  let previous = 0;
  headings.forEach((h) => {
    checked += 1;
    const level = Number(h.tagName[1]);
    if (previous && level > previous + 1) {
      add({
        ruleId: "heading-order",
        rule: "Heading levels never skip",
        severity: "info",
        problem: `Heading jumps from h${previous} to h${level}, breaking the document outline.`,
        fix: `Use h${previous + 1} here, or restructure the section so levels increase one at a time.`,
        element: describe(h),
        snippet: snippetOf(h),
      });
    }
    previous = level;
  });

  rule("duplicate-id", "Element ids are unique");
  const seen = new Map<string, number>();
  root.querySelectorAll("[id]").forEach((el) => {
    checked += 1;
    const id = el.id;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  });
  seen.forEach((count, id) => {
    if (count > 1) {
      add({
        ruleId: "duplicate-id",
        rule: "Element ids are unique",
        severity: "warning",
        problem: `id="${id}" appears ${count} times, so label and aria-labelledby references resolve to the wrong element.`,
        fix: "Suffix the id with the row key, or generate it with React's useId().",
        element: `#${id}`,
        snippet: `<… id="${id}">`,
      });
    }
  });

  rule("aria-ref", "aria-labelledby / describedby point at real ids");
  root.querySelectorAll("[aria-labelledby], [aria-describedby]").forEach((el) => {
    checked += 1;
    (["aria-labelledby", "aria-describedby"] as const).forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!value) return;
      const missing = value
        .split(/\s+/)
        .filter(Boolean)
        .filter((id) => !doc.getElementById(id));
      if (missing.length) {
        add({
          ruleId: "aria-ref",
          rule: "aria-labelledby / describedby point at real ids",
          severity: "critical",
          problem: `${attr} references missing id(s): ${missing.join(", ")}.`,
          fix: "Point the attribute at an element that exists in the DOM, or remove it.",
          element: describe(el),
          snippet: snippetOf(el),
        });
      }
    });
  });

  const failed = new Set(findings.map((f) => f.ruleId));
  const passedRules = Array.from(ranRules.entries())
    .filter(([id]) => !failed.has(id))
    .map(([, v]) => v.rule);

  return { findings, checked, passedRules };
}

export const severityOrder: Severity[] = ["critical", "warning", "info"];

export const severityCopy: Record<Severity, { label: string; blurb: string }> = {
  critical: { label: "Critical", blurb: "Blocks screen-reader or keyboard users outright." },
  warning: { label: "Warning", blurb: "Degrades the experience for assistive tech." },
  info: { label: "Info", blurb: "Best-practice polish worth fixing." },
};
