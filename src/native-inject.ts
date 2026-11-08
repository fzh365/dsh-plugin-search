export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return String(input);
}

export function isChatCompletionsUrl(url: string): boolean {
  try {
    return /\/chat\/completions\/?$/.test(new URL(url).pathname);
  } catch {
    return /\/chat\/completions(\?|$)/.test(url);
  }
}

export function injectNativeSearchBody(body: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return body;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return body;
  const obj = parsed as Record<string, unknown>;
  const existing = obj.web_search_options;
  if (existing !== undefined && existing !== null && typeof existing === "object" && !Array.isArray(existing)) {
    return body;
  }
  obj.web_search_options = {};
  return JSON.stringify(obj);
}

export function rewriteChatCompletionsInit(
  url: string,
  init: RequestInit | undefined,
  enabled: boolean,
): RequestInit | undefined {
  if (!enabled || init === undefined || !isChatCompletionsUrl(url)) return init;
  const body = init.body;
  if (typeof body !== "string") return init;
  const next = injectNativeSearchBody(body);
  if (next === body) return init;
  return { ...init, body: next };
}

export function wrapFetch(original: typeof fetch, enabled: () => boolean): typeof fetch {
  return function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    try {
      init = rewriteChatCompletionsInit(requestUrl(input), init, enabled());
    } catch {
      // leave the request unchanged
    }
    return original.call(globalThis, input, init);
  } as typeof fetch;
}