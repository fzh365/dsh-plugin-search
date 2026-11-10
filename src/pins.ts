export const PROVIDER_ID = "simple-search";

export type SearchMode = "model" | "tavily";

export interface ConfigShape {
  searchMode?: unknown;
  tavilyApiKey?: unknown;
  /** Comma separated provider route ids that always use local Tavily + Bing. */
  tavilyProviders?: unknown;
}

/** Provider routes that cannot take model-side search: always local Tavily + Bing. */
export const FORCED_TAVILY_PROVIDERS: readonly string[] = ["deepseek-official"];

interface VolatileField {
  get(): unknown;
}

export function readString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && "get" in value) {
    const got = (value as VolatileField).get();
    return typeof got === "string" ? got : undefined;
  }
  return undefined;
}

export function normalizeSearchMode(value: string | undefined): SearchMode {
  return value === "tavily" ? "tavily" : "model";
}

export function searchModeOf(config: ConfigShape = {}): SearchMode {
  return normalizeSearchMode(readString(config.searchMode));
}

export function isModelSearch(config: ConfigShape = {}): boolean {
  return searchModeOf(config) === "model";
}

export function parseProviderList(text: string | undefined): string[] {
  return (text ?? "")
    .split(/[,，、;；\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

/** The user's list plus the forced ones, without duplicates. */
export function tavilyProvidersOf(config: ConfigShape = {}): string[] {
  return [...new Set([...FORCED_TAVILY_PROVIDERS, ...parseProviderList(readString(config.tavilyProviders))])];
}

/** True when this provider route is served by local Tavily + Bing instead of model-side search. */
export function usesLocalSearch(config: ConfigShape = {}, provider?: string): boolean {
  if (!isModelSearch(config)) return true;
  return provider !== undefined && tavilyProvidersOf(config).includes(provider.toLowerCase());
}

/** dsh-tool-web admits web_search only when this is true. */
export function toolSearchReady(config: ConfigShape = {}, provider?: string): boolean {
  return usesLocalSearch(config, provider);
}

export function resolveTavilyApiKey(
  config: ConfigShape = {},
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  const configured = readString(config.tavilyApiKey)?.trim();
  if (configured) return configured;
  const fromEnv = env.TAVILY_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  return undefined;
}

export function providerPins(): {
  searchProvider: string;
  fetchProvider: string;
} {
  return {
    searchProvider: PROVIDER_ID,
    fetchProvider: "http",
  };
}
