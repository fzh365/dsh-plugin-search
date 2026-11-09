export interface SearchSource {
    url: string;
    title?: string;
    snippet?: string;
    publishedAt?: string;
}
export interface SearchResult {
    sources: SearchSource[];
    truncated: boolean;
    content?: string;
}
export interface LocalSearchRequest {
    query: string;
    maxResults?: number;
    signal?: AbortSignal;
}
export declare function decodeHtml(input: string): string;
export declare function unwrapRedirect(href: string, base: string): string;
export declare function parseBingHtml(html: string): SearchSource[];
export declare function localSearch(request: LocalSearchRequest): Promise<SearchResult>;
