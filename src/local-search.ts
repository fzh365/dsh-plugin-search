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

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const HTML_HEADERS: Record<string, string> = {
  accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
  "user-agent": BROWSER_UA,
};

export function decodeHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&ensp;|&emsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function unwrapRedirect(href: string, base: string): string {
  try {
    const url = new URL(href, base);
    const uddg = url.searchParams.get("uddg");
    if (uddg) return uddg;
    const u = url.searchParams.get("u");
    if (u && /^https?:/i.test(u)) return u;
    if (u && u.startsWith("a1")) {
      const padded = u.slice(2).replace(/-/g, "+").replace(/_/g, "/");
      try {
        const decoded = Buffer.from(padded, "base64").toString("utf8");
        if (/^https?:/i.test(decoded)) return decoded;
      } catch {
        /* ignore */
      }
    }
    return url.href;
  } catch {
    return href;
  }
}

function pushSource(sources: SearchSource[], url: string, title?: string, snippet?: string): void {
  if (!/^https?:\/\//i.test(url)) return;
  if (sources.some((s) => s.url === url)) return;
  const source: SearchSource = { url };
  if (title) source.title = title;
  if (snippet) source.snippet = snippet;
  sources.push(source);
}

export function parseDuckDuckGoHtml(html: string): SearchSource[] {
  const sources: SearchSource[] = [];
  const re =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const url = unwrapRedirect(decodeHtml(match[1] ?? ""), "https://html.duckduckgo.com/html/");
    const title = decodeHtml(match[2] ?? "");
    pushSource(sources, url, title);
  }
  const snippetRe =
    /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = snippetRe.exec(html))) {
    const url = unwrapRedirect(decodeHtml(match[1] ?? ""), "https://html.duckduckgo.com/html/");
    const snippet = decodeHtml(match[2] ?? "");
    const existing = sources.find((s) => s.url === url);
    if (existing && snippet) existing.snippet = snippet;
  }
  return sources;
}

export function parseBingHtml(html: string): SearchSource[] {
  const sources: SearchSource[] = [];
  const blocks = html.split(/<li[^>]*class="[^"]*\bb_algo\b[^"]*"/i).slice(1);
  for (const block of blocks) {
    const hrefMatch = /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!hrefMatch) continue;
    const url = unwrapRedirect(decodeHtml(hrefMatch[1] ?? ""), "https://www.bing.com/");
    const title = decodeHtml(hrefMatch[2] ?? "");
    const snippetMatch =
      /<(?:p|div)[^>]*class="[^"]*(?:b_lineclamp|b_caption|b_algoSlug)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i.exec(
        block,
      );
    const snippet = snippetMatch ? decodeHtml(snippetMatch[1] ?? "") : undefined;
    pushSource(sources, url, title, snippet);
  }
  return sources;
}

async function fetchHtml(url: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(url, { headers: HTML_HEADERS, redirect: "follow", signal });
  if (!response.ok) {
    throw new Error(`search failed HTTP ${response.status}`);
  }
  return response.text();
}

async function searchDuckDuckGo(query: string, signal?: AbortSignal): Promise<SearchSource[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  return parseDuckDuckGoHtml(await fetchHtml(url, signal));
}

async function searchBing(query: string, signal?: AbortSignal): Promise<SearchSource[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  return parseBingHtml(await fetchHtml(url, signal));
}

export async function localSearch(request: LocalSearchRequest): Promise<SearchResult> {
  const maxResults = request.maxResults ?? 5;
  const errors: string[] = [];
  for (const engine of [searchDuckDuckGo, searchBing] as const) {
    try {
      const sources = (await engine(request.query, request.signal)).slice(0, maxResults);
      if (sources.length > 0) return { sources, truncated: false };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(`local search failed: ${errors.join("; ") || "no results"}`);
}
