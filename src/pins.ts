export const PROVIDER_ID = "simple-search";
export const DEEPSEEK_SEARCH = "deepseek-search-api";

export type SearchBackend = "plugin" | "deepseek";
export type FetchBackend = "plugin" | "deepseek";
export type Backend = SearchBackend | FetchBackend;

export interface ConfigShape {
  searchBackend?: string;
  fetchBackend?: string;
}

export function normalizeSearchBackend(value: string | undefined): SearchBackend {
  return value === "deepseek" ? "deepseek" : "plugin";
}

export function normalizeFetchBackend(value: string | undefined): FetchBackend {
  return value === "deepseek" ? "deepseek" : "plugin";
}

export function normalizeConfig(config: ConfigShape = {}): {
  searchBackend: SearchBackend;
  fetchBackend: FetchBackend;
} {
  return {
    searchBackend: normalizeSearchBackend(config.searchBackend),
    fetchBackend: normalizeFetchBackend(config.fetchBackend),
  };
}

export function providerPins(config: ConfigShape = {}): {
  searchProvider: string;
  fetchProvider: string;
} {
  const normalized = normalizeConfig(config);
  return {
    searchProvider: normalized.searchBackend === "deepseek" ? DEEPSEEK_SEARCH : PROVIDER_ID,
    fetchProvider: normalized.fetchBackend === "deepseek" ? "deepseek-fetch-api" : "http",
  };
}

export function backendFromFetchProvider(id: string | undefined): FetchBackend {
  return id === "deepseek-fetch-api" ? "deepseek" : "plugin";
}
