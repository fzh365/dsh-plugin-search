import z from "@deepseek-ai/schemastery";
import { wrapFetch } from "./native-inject.js";
import {
  PROVIDER_ID,
  isModelSearch,
  resolveTavilyApiKey,
  searchModeOf,
  toolSearchReady,
  type ConfigShape,
} from "./pins.js";
import { PROMPT_SECTION, composeSearchPrompt } from "./prompt.js";
import { pluginSearch } from "./search.js";

export {
  PROVIDER_ID,
  isModelSearch,
  providerPins,
  resolveTavilyApiKey,
  searchModeOf,
  toolSearchReady,
} from "./pins.js";
export type { ConfigShape, SearchMode } from "./pins.js";
export { composeSearchPrompt } from "./prompt.js";
export { pluginSearch } from "./search.js";

export const name = "dsh-plugin-search";
export const inject = ["web"];

export const Config = z.object({
  searchMode: z.string().default("model").volatile(),
  tavilyApiKey: z.string().default("").volatile(),
});

interface WebSearchRequest {
  query: string;
  maxResults?: number;
}

interface WebRuntime {
  registerSearchProvider(provider: {
    id: string;
    available(): boolean;
    ready?(): boolean | Promise<boolean>;
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<unknown>;
  }): unknown;
}

interface SettingsChild {
  settings?: {
    configure(policy: { auto: boolean }, fiber?: unknown): unknown;
  };
  effect(fn: () => unknown, label?: string): unknown;
}

interface SystemPromptRuntime {
  section?(spec: { name: string; order?: number; text: string }): unknown;
}

interface SystemPromptChild {
  systemPrompt?: SystemPromptRuntime;
  effect?(fn: () => unknown, label?: string): unknown;
}

interface DshContext {
  web: WebRuntime;
  inject?(deps: string[], callback: (child: SettingsChild & SystemPromptChild) => void): unknown;
  effect?(fn: () => unknown, label?: string): unknown;
  fiber?: unknown;
}

export function apply(ctx: DshContext, config: ConfigShape = {}): void {
  ctx.web.registerSearchProvider({
    id: PROVIDER_ID,
    available: () => true,
    ready: () => toolSearchReady(config),
    search: (request, signal) =>
      pluginSearch({
        query: request.query,
        maxResults: request.maxResults,
        apiKey: resolveTavilyApiKey(config),
        signal,
      }),
  });
  ctx.effect?.(() => {
    const original = globalThis.fetch;
    globalThis.fetch = wrapFetch(original, () => isModelSearch(config));
    return () => {
      globalThis.fetch = original;
    };
  }, "dsh-plugin-search model-side search inject");
  ctx.inject?.(["systemPrompt"], (child) => {
    child.effect?.(() => {
      const text = composeSearchPrompt(searchModeOf(config));
      const dispose = child.systemPrompt?.section?.({
        name: PROMPT_SECTION,
        order: 500,
        text,
      });
      return () => {
        if (typeof dispose === "function") dispose();
      };
    }, "dsh-plugin-search prompt");
  });
  ctx.inject?.(["settings"], (child) => {
    const settings = child.settings;
    if (settings === undefined) return;
    child.effect(() => settings.configure({ auto: false }, ctx.fiber), "dsh-plugin-search page policy");
  });
}
