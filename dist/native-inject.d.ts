export declare function requestUrl(input: RequestInfo | URL): string;
export declare function isChatCompletionsUrl(url: string): boolean;
/** Adds OpenAI Chat Completions web_search_options so the model API can run server-side search. */
export declare function injectNativeSearchBody(body: string): string;
export declare function rewriteChatCompletionsInit(url: string, init: RequestInit | undefined, enabled: boolean): RequestInit | undefined;
export declare function wrapFetch(original: typeof fetch, enabled: () => boolean): typeof fetch;
