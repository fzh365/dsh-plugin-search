import z from "@deepseek-ai/schemastery";
import { localSearch } from "./local-search.js";
import { wrapFetch } from "./native-inject.js";
import {
  PROVIDER_ID,
  normalizeSearchBackend,
  type ConfigShape,
} from "./pins.js";

export { PROVIDER_ID, normalizeConfig, providerPins } from "./pins.js";
export type { Backend, ConfigShape, FetchBackend, SearchBackend } from "./pins.js";

export const name = "dsh-plugin-search";
export const inject = ["web"];

export const Config = z.object({
  searchBackend: z.string().default("plugin").volatile(),
  fetchBackend: z.string().default("plugin").volatile(),
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

interface DshContext {
  web: WebRuntime;
  inject?(deps: string[], callback: (child: SettingsChild) => void): unknown;
  effect?(fn: () => unknown, label?: string): unknown;
  fiber?: unknown;
}

interface VolatileField {
  get(): unknown;
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && "get" in value) {
    const got = (value as VolatileField).get();
    return typeof got === "string" ? got : undefined;
  }
  return undefined;
}

function searchIsPlugin(config: ConfigShape): boolean {
  return normalizeSearchBackend(readString(config.searchBackend)) === "plugin";
}

export function apply(ctx: DshContext, config: ConfigShape = {}): void {
  ctx.web.registerSearchProvider({
    id: PROVIDER_ID,
    available: () => true,
    ready: () => !searchIsPlugin(config),
    search: (request, signal) =>
      localSearch({
        query: request.query,
        maxResults: request.maxResults,
        signal,
      }),
  });
  ctx.effect?.(() => {
    const original = globalThis.fetch;
    globalThis.fetch = wrapFetch(original, () => searchIsPlugin(config));
    return () => {
      globalThis.fetch = original;
    };
  }, "dsh-plugin-search native search inject");
  ctx.inject?.(["settings"], (child) => {
    const settings = child.settings;
    if (settings === undefined) return;
    child.effect(() => settings.configure({ auto: false }, ctx.fiber), "dsh-plugin-search page policy");
  });
}
