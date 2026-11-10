export const PROVIDER_ID = "simple-search";
/** Provider routes that cannot take model-side search: always local Tavily + Bing. */
export const FORCED_TAVILY_PROVIDERS = ["deepseek-official"];
export function readString(value) {
    if (typeof value === "string")
        return value;
    if (value !== null && typeof value === "object" && "get" in value) {
        const got = value.get();
        return typeof got === "string" ? got : undefined;
    }
    return undefined;
}
export function normalizeSearchMode(value) {
    return value === "tavily" ? "tavily" : "model";
}
export function searchModeOf(config = {}) {
    return normalizeSearchMode(readString(config.searchMode));
}
export function isModelSearch(config = {}) {
    return searchModeOf(config) === "model";
}
export function parseProviderList(text) {
    return (text ?? "")
        .split(/[,，、;；\s]+/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
}
/** The user's list plus the forced ones, without duplicates. */
export function tavilyProvidersOf(config = {}) {
    return [...new Set([...FORCED_TAVILY_PROVIDERS, ...parseProviderList(readString(config.tavilyProviders))])];
}
/** True when this provider route is served by local Tavily + Bing instead of model-side search. */
export function usesLocalSearch(config = {}, provider) {
    if (!isModelSearch(config))
        return true;
    return provider !== undefined && tavilyProvidersOf(config).includes(provider.toLowerCase());
}
/** dsh-tool-web admits web_search only when this is true. */
export function toolSearchReady(config = {}, provider) {
    return usesLocalSearch(config, provider);
}
export function resolveTavilyApiKey(config = {}, env = process.env) {
    const configured = readString(config.tavilyApiKey)?.trim();
    if (configured)
        return configured;
    const fromEnv = env.TAVILY_API_KEY?.trim();
    if (fromEnv)
        return fromEnv;
    return undefined;
}
export function providerPins() {
    return {
        searchProvider: PROVIDER_ID,
        fetchProvider: "http",
    };
}
