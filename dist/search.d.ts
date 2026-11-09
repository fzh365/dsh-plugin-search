import { type SearchResult } from "./tavily.js";
export interface PluginSearchRequest {
    query: string;
    maxResults?: number;
    apiKey?: string;
    signal?: AbortSignal;
}
export declare function pluginSearch(request: PluginSearchRequest): Promise<SearchResult>;
