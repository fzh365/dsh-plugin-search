export type RequestKind = "chat" | "responses" | "messages" | "gemini";

export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return String(input);
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return (url.split("?")[0] ?? url).replace(/^https?:\/\/[^/]+/i, "");
  }
}

export function requestKind(url: string): RequestKind | undefined {
  const path = pathnameOf(url);
  if (/\/chat\/completions\/?$/.test(path)) return "chat";
  if (/\/responses\/?$/.test(path)) return "responses";
  if (/\/messages\/?$/.test(path)) return "messages";
  if (/:(?:stream)?generateContent$/.test(path) || /\/(?:stream)?generateContent\/?$/.test(path)) {
    return "gemini";
  }
  return undefined;
}

export function isChatCompletionsUrl(url: string): boolean {
  return requestKind(url) === "chat";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toolType(tool: unknown): string {
  return isRecord(tool) && typeof tool.type === "string" ? tool.type : "";
}

function hasNativeWebSearchTool(tools: unknown): boolean {
  return Array.isArray(tools) && tools.some((tool) => toolType(tool).startsWith("web_search"));
}

function hasGeminiSearchTool(tools: unknown): boolean {
  return (
    Array.isArray(tools) &&
    tools.some((tool) => isRecord(tool) && ("googleSearch" in tool || "google_search" in tool))
  );
}

function ensureToolList(obj: Record<string, unknown>): unknown[] | undefined {
  if (obj.tools === undefined) {
    const tools: unknown[] = [];
    obj.tools = tools;
    return tools;
  }
  return Array.isArray(obj.tools) ? obj.tools : undefined;
}

function hasWebSearchOptions(obj: Record<string, unknown>): boolean {
  const existing = obj.web_search_options;
  return existing !== undefined && existing !== null && typeof existing === "object" && !Array.isArray(existing);
}

/** Marks a model request for server-side search. Chat Completions gets both OpenAI markers. */
export function injectNativeSearch(obj: Record<string, unknown>, kind: RequestKind): boolean {
  let changed = false;
  if (kind === "chat") {
    if (!hasWebSearchOptions(obj)) {
      obj.web_search_options = {};
      changed = true;
    }
    if (!hasNativeWebSearchTool(obj.tools)) {
      const tools = ensureToolList(obj);
      if (tools) {
        tools.push({ type: "web_search" });
        changed = true;
      }
    }
    return changed;
  }
  if (kind === "responses") {
    if (hasNativeWebSearchTool(obj.tools)) return false;
    const tools = ensureToolList(obj);
    if (!tools) return false;
    tools.push({ type: "web_search" });
    return true;
  }
  if (kind === "messages") {
    if (hasNativeWebSearchTool(obj.tools)) return false;
    const tools = ensureToolList(obj);
    if (!tools) return false;
    tools.push({ type: "web_search_20250305", name: "web_search" });
    return true;
  }
  if (hasGeminiSearchTool(obj.tools)) return false;
  const tools = ensureToolList(obj);
  if (!tools) return false;
  tools.push({ googleSearch: {} });
  return true;
}

export function injectNativeSearchBody(body: string, kind: RequestKind = "chat"): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return body;
  }
  if (!isRecord(parsed)) return body;
  if (!injectNativeSearch(parsed, kind)) return body;
  return JSON.stringify(parsed);
}

export function rewriteModelSearchInit(
  url: string,
  init: RequestInit | undefined,
  enabled: boolean,
): RequestInit | undefined {
  if (!enabled || init === undefined) return init;
  const kind = requestKind(url);
  if (kind === undefined) return init;
  const body = init.body;
  if (typeof body !== "string") return init;
  const next = injectNativeSearchBody(body, kind);
  if (next === body) return init;
  return { ...init, body: next };
}

export function rewriteChatCompletionsInit(
  url: string,
  init: RequestInit | undefined,
  enabled: boolean,
): RequestInit | undefined {
  return rewriteModelSearchInit(url, init, enabled);
}

export function wrapFetch(original: typeof fetch, enabled: () => boolean): typeof fetch {
  return function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    try {
      init = rewriteModelSearchInit(requestUrl(input), init, enabled());
    } catch {
      // leave the request unchanged
    }
    return original.call(globalThis, input, init);
  } as typeof fetch;
}
