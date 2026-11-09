export declare const PROVIDER_ID = "simple-search";
export type SearchMode = "model" | "tavily";
export interface ConfigShape {
    searchMode?: unknown;
    tavilyApiKey?: unknown;
}
export declare function readString(value: unknown): string | undefined;
export declare function normalizeSearchMode(value: string | undefined): SearchMode;
export declare function searchModeOf(config?: ConfigShape): SearchMode;
export declare function isModelSearch(config?: ConfigShape): boolean;
/** dsh-tool-web admits web_search only when this is true. */
export declare function toolSearchReady(config?: ConfigShape): boolean;
export declare function resolveTavilyApiKey(config?: ConfigShape, env?: Record<string, string | undefined>): string | undefined;
export declare function providerPins(): {
    searchProvider: string;
    fetchProvider: string;
};
