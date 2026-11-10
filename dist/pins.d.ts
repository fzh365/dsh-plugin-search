export declare const PROVIDER_ID = "simple-search";
export type SearchMode = "model" | "tavily";
export interface ConfigShape {
    searchMode?: unknown;
    tavilyApiKey?: unknown;
    /** Comma separated provider route ids that always use local Tavily + Bing. */
    tavilyProviders?: unknown;
}
/** Provider routes that cannot take model-side search: always local Tavily + Bing. */
export declare const FORCED_TAVILY_PROVIDERS: readonly string[];
export declare function readString(value: unknown): string | undefined;
export declare function normalizeSearchMode(value: string | undefined): SearchMode;
export declare function searchModeOf(config?: ConfigShape): SearchMode;
export declare function isModelSearch(config?: ConfigShape): boolean;
export declare function parseProviderList(text: string | undefined): string[];
/** The user's list plus the forced ones, without duplicates. */
export declare function tavilyProvidersOf(config?: ConfigShape): string[];
/** True when this provider route is served by local Tavily + Bing instead of model-side search. */
export declare function usesLocalSearch(config?: ConfigShape, provider?: string): boolean;
/** dsh-tool-web admits web_search only when this is true. */
export declare function toolSearchReady(config?: ConfigShape, provider?: string): boolean;
export declare function resolveTavilyApiKey(config?: ConfigShape, env?: Record<string, string | undefined>): string | undefined;
export declare function providerPins(): {
    searchProvider: string;
    fetchProvider: string;
};
