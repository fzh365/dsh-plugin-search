export function requestUrl(input) {
    if (typeof input === "string")
        return input;
    if (input instanceof URL)
        return input.href;
    if (typeof Request !== "undefined" && input instanceof Request)
        return input.url;
    return String(input);
}
export function isChatCompletionsUrl(url) {
    try {
        return /\/chat\/completions\/?$/.test(new URL(url).pathname);
    }
    catch {
        return /\/chat\/completions(\?|$)/.test(url);
    }
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasWebSearchOptions(obj) {
    const existing = obj.web_search_options;
    return existing !== undefined && existing !== null && typeof existing === "object" && !Array.isArray(existing);
}
/** Adds OpenAI Chat Completions web_search_options so the model API can run server-side search. */
export function injectNativeSearchBody(body) {
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        return body;
    }
    if (!isRecord(parsed))
        return body;
    if (hasWebSearchOptions(parsed))
        return body;
    parsed.web_search_options = {};
    return JSON.stringify(parsed);
}
export function rewriteChatCompletionsInit(url, init, enabled) {
    if (!enabled || init === undefined || !isChatCompletionsUrl(url))
        return init;
    const body = init.body;
    if (typeof body !== "string")
        return init;
    const next = injectNativeSearchBody(body);
    if (next === body)
        return init;
    return { ...init, body: next };
}
export function wrapFetch(original, enabled) {
    return function patchedFetch(input, init) {
        try {
            init = rewriteChatCompletionsInit(requestUrl(input), init, enabled());
        }
        catch {
            // leave the request unchanged
        }
        return original.call(globalThis, input, init);
    };
}
