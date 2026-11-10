export function requestUrl(input) {
    if (typeof input === "string")
        return input;
    if (input instanceof URL)
        return input.href;
    if (typeof Request !== "undefined" && input instanceof Request)
        return input.url;
    return String(input);
}
function pathnameOf(url) {
    try {
        return new URL(url, "http://localhost").pathname;
    }
    catch {
        return (url.split(/[?#]/)[0] ?? url).replace(/^https?:\/\/[^/]+/i, "");
    }
}
export function requestKind(url) {
    const path = pathnameOf(url);
    if (/\/chat\/completions\/?$/.test(path))
        return "chat";
    if (/\/responses\/?$/.test(path))
        return "responses";
    if (/\/messages\/?$/.test(path))
        return "messages";
    return undefined;
}
export function isChatCompletionsUrl(url) {
    return requestKind(url) === "chat";
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasWebSearchOptions(obj) {
    return obj.web_search_options !== undefined;
}
/** A server-side search tool, e.g. web_search, web_search_preview, web_search_20250305. */
function hasWebSearchTool(tools) {
    return tools.some((tool) => isRecord(tool) && typeof tool.type === "string" && tool.type.startsWith("web_search"));
}
/**
 * The local dsh web_search function tool, in any protocol's shape:
 * Chat {type:"function", function:{name}}, Responses {type:"function", name}, Messages {name, input_schema}.
 * dsh lists it only when this step searches locally (Tavily + Bing), so its presence means "do not inject".
 */
export function hasLocalWebSearchTool(tools) {
    return tools.some((tool) => {
        if (!isRecord(tool))
            return false;
        if (typeof tool.type === "string" && tool.type.startsWith("web_search"))
            return false;
        const fn = isRecord(tool.function) ? tool.function : undefined;
        return tool.name === "web_search" || fn?.name === "web_search";
    });
}
/** DeepSeek's own API answers a marked request with server_tool_use blocks dsh cannot read. */
export function isForcedLocalUrl(url) {
    try {
        return new URL(url, "http://localhost").hostname === "api.deepseek.com";
    }
    catch {
        return false;
    }
}
function appendTool(obj, tool) {
    if (!Array.isArray(obj.tools) || hasWebSearchTool(obj.tools))
        return false;
    obj.tools.push(tool);
    return true;
}
/**
 * Marks a request for server-side search in the form magpie recognizes:
 * Completions: top-level web_search_options. Responses / Messages: a tool whose type starts with web_search.
 */
export function injectNativeSearch(obj, kind) {
    // Only model requests: other APIs may also end in /messages or /responses.
    if (typeof obj.model !== "string")
        return false;
    // Only agent turns, which carry tools. Side requests such as session titles carry none.
    if (!Array.isArray(obj.tools) || obj.tools.length === 0)
        return false;
    // This step searches locally: the request itself says so, whatever other agents are doing.
    if (hasLocalWebSearchTool(obj.tools))
        return false;
    // Already marked for server-side search in either form: do not mark twice.
    if (hasWebSearchOptions(obj))
        return false;
    if (Array.isArray(obj.tools) && hasWebSearchTool(obj.tools))
        return false;
    if (kind === "chat") {
        obj.web_search_options = {};
        return true;
    }
    if (kind === "responses")
        return appendTool(obj, { type: "web_search" });
    return appendTool(obj, { type: "web_search_20250305", name: "web_search" });
}
export function injectNativeSearchBody(body, kind = "chat") {
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        return body;
    }
    if (!isRecord(parsed))
        return body;
    if (!injectNativeSearch(parsed, kind))
        return body;
    return JSON.stringify(parsed);
}
function withoutContentLength(headers) {
    if (headers === undefined)
        return undefined;
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
        const next = new Headers(headers);
        next.delete("content-length");
        return next;
    }
    if (Array.isArray(headers))
        return headers.filter(([key]) => key.toLowerCase() !== "content-length");
    return Object.fromEntries(Object.entries(headers).filter(([key]) => key.toLowerCase() !== "content-length"));
}
export function rewriteModelSearchInit(url, init, enabled) {
    if (!enabled || init === undefined)
        return init;
    if (isForcedLocalUrl(url))
        return init;
    const kind = requestKind(url);
    if (kind === undefined)
        return init;
    const body = init.body;
    if (typeof body !== "string")
        return init;
    const next = injectNativeSearchBody(body, kind);
    if (next === body)
        return init;
    return { ...init, body: next, headers: withoutContentLength(init.headers) };
}
/** Kept for existing callers; same behavior as rewriteModelSearchInit. */
export const rewriteChatCompletionsInit = rewriteModelSearchInit;
export function wrapFetch(original, enabled) {
    return function patchedFetch(input, init) {
        try {
            init = rewriteModelSearchInit(requestUrl(input), init, enabled());
        }
        catch {
            // leave the request unchanged
        }
        return original.call(globalThis, input, init);
    };
}
