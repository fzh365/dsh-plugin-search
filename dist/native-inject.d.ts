export type RequestKind = "chat" | "responses" | "messages";
export declare function requestUrl(input: RequestInfo | URL): string;
export declare function requestKind(url: string): RequestKind | undefined;
export declare function isChatCompletionsUrl(url: string): boolean;
/**
 * The local dsh web_search function tool, in any protocol's shape:
 * Chat {type:"function", function:{name}}, Responses {type:"function", name}, Messages {name, input_schema}.
 * dsh lists it only when this step searches locally (Tavily + Bing), so its presence means "do not inject".
 */
export declare function hasLocalWebSearchTool(tools: unknown[]): boolean;
/** DeepSeek's own API answers a marked request with server_tool_use blocks dsh cannot read. */
export declare function isForcedLocalUrl(url: string): boolean;
/**
 * Marks a request for server-side search in the form magpie recognizes:
 * Completions: top-level web_search_options. Responses / Messages: a tool whose type starts with web_search.
 */
export declare function injectNativeSearch(obj: Record<string, unknown>, kind: RequestKind): boolean;
export declare function injectNativeSearchBody(body: string, kind?: RequestKind): string;
export declare function rewriteModelSearchInit(url: string, init: RequestInit | undefined, enabled: boolean): RequestInit | undefined;
/** Kept for existing callers; same behavior as rewriteModelSearchInit. */
export declare const rewriteChatCompletionsInit: typeof rewriteModelSearchInit;
export declare function wrapFetch(original: typeof fetch, enabled: () => boolean): typeof fetch;
