import { localSearch } from "./local-search.js";
import { tavilySearch } from "./tavily.js";
function errorText(error) {
    return error instanceof Error ? error.message : String(error);
}
export async function pluginSearch(request) {
    const maxResults = request.maxResults ?? 5;
    const errors = [];
    try {
        const result = await tavilySearch({
            query: request.query,
            maxResults,
            apiKey: request.apiKey,
            signal: request.signal,
        });
        const sources = result.sources.slice(0, maxResults);
        if (sources.length > 0)
            return { ...result, sources };
        errors.push("tavily: no results");
    }
    catch (error) {
        errors.push(`tavily: ${errorText(error)}`);
    }
    try {
        return await localSearch({
            query: request.query,
            maxResults,
            signal: request.signal,
        });
    }
    catch (error) {
        errors.push(`bing: ${errorText(error)}`);
    }
    throw new Error(`search failed: ${errors.join("; ")}`);
}
