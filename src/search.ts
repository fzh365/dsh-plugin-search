import { localSearch } from "./local-search.js";
import { tavilySearch, type SearchResult } from "./tavily.js";

export interface PluginSearchRequest {
  query: string;
  maxResults?: number;
  apiKey?: string;
  signal?: AbortSignal;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function pluginSearch(request: PluginSearchRequest): Promise<SearchResult> {
  const maxResults = request.maxResults ?? 5;
  const errors: string[] = [];

  try {
    const result = await tavilySearch({
      query: request.query,
      maxResults,
      apiKey: request.apiKey,
      signal: request.signal,
    });
    const sources = result.sources.slice(0, maxResults);
    if (sources.length > 0) return { ...result, sources };
    errors.push("tavily: no results");
  } catch (error) {
    errors.push(`tavily: ${errorText(error)}`);
  }

  try {
    return await localSearch({
      query: request.query,
      maxResults,
      signal: request.signal,
    });
  } catch (error) {
    errors.push(`bing: ${errorText(error)}`);
  }

  throw new Error(`search failed: ${errors.join("; ")}`);
}
