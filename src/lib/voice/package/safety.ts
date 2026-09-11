const TEMPLATE_TOKEN = /{{[^{}]*}}/;

export function assertNoTemplateTokens(value: unknown, location = "generated package"): void {
  if (typeof value === "string") {
    if (TEMPLATE_TOKEN.test(value)) {
      throw new Error(`Unresolved template placeholder in ${location}: ${value.match(TEMPLATE_TOKEN)?.[0]}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoTemplateTokens(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoTemplateTokens(item, `${location}.${key}`);
    }
  }
}

export type PromptLine = { kind: "instruction" | "spoken" | "customer_data"; text: string; field?: string };

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Neutralize only wire-format labels; ordinary business punctuation and prose remain intact. */
function sanitizeControlLabels(text: string): string {
  return text.replace(/\[(INSTRUCTION|SPOKEN|CUSTOMER_DATA(?:_BEGIN|_END)?)\]/gi, (_match, label: string) => `［${label}］`);
}

export function instruction(text: string): PromptLine {
  return { kind: "instruction", text: oneLine(text) };
}

export function spoken(text: string): PromptLine {
  return { kind: "spoken", text: oneLine(text) };
}

export function customerData(field: string, text: string): PromptLine {
  return { kind: "customer_data", field: oneLine(field).replace(/[^a-z0-9_.-]/gi, "_"), text: sanitizeControlLabels(oneLine(text)) };
}

/**
 * A deliberately explicit prompt wire format: spoken copy is JSON-quoted while
 * operational directions are not. This makes accidental stage-direction speech
 * visible and mechanically testable.
 */
export function renderPrompt(lines: PromptLine[]): string {
  const rendered = lines
    .filter(({ text }) => text.length > 0)
    .map(({ kind, text, field }) => {
      if (kind === "spoken") return `[SPOKEN] ${JSON.stringify(text)}`;
      if (kind === "customer_data") return `[CUSTOMER_DATA] ${JSON.stringify({ field, value: text })}`;
      return `[INSTRUCTION] ${text}`;
    })
    .join("\n");
  assertPromptSafety(rendered);
  return rendered;
}

export function assertPromptSafety(prompt: string): void {
  assertNoTemplateTokens(prompt, "assistant system prompt");
  for (const [index, line] of prompt.split("\n").entries()) {
    if (!line.trim()) continue;
    if (line.startsWith("[SPOKEN] ")) {
      const quoted = line.slice("[SPOKEN] ".length);
      let parsed: unknown;
      try {
        parsed = JSON.parse(quoted);
      } catch {
        throw new Error(`Spoken line ${index + 1} must be enclosed in quotation marks.`);
      }
      if (typeof parsed !== "string" || !quoted.startsWith('"') || !quoted.endsWith('"')) {
        throw new Error(`Spoken line ${index + 1} must be enclosed in quotation marks.`);
      }
    } else if (line.startsWith("[CUSTOMER_DATA] ")) {
      const encoded = line.slice("[CUSTOMER_DATA] ".length);
      let parsed: unknown;
      try { parsed = JSON.parse(encoded); } catch { throw new Error(`Customer data line ${index + 1} must be valid JSON.`); }
      if (!parsed || typeof parsed !== "object" || typeof (parsed as { field?: unknown }).field !== "string" || typeof (parsed as { value?: unknown }).value !== "string") {
        throw new Error(`Customer data line ${index + 1} must contain string field and value properties.`);
      }
    } else if (line.startsWith("[INSTRUCTION] ")) {
      const direction = line.slice("[INSTRUCTION] ".length).trim();
      if (direction.startsWith('"') && direction.endsWith('"')) {
        throw new Error(`Instruction line ${index + 1} must not be presented as spoken copy.`);
      }
    } else {
      throw new Error(`Prompt line ${index + 1} is not classified as instruction or spoken copy.`);
    }
  }
}
