export const PROVIDER_ID = "simple-search";
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
/** dsh-tool-web admits web_search only when this is true. */
export function toolSearchReady(config = {}) {
    return !isModelSearch(config);
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
