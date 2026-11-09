import assert from "node:assert/strict";
import { test } from "node:test";
import { pluginSearch } from "../dist/search.js";

const BING_HTML = `
  <li class="b_algo">
    <h2><a href="https://example.com/bing">Bing Hit</a></h2>
    <p class="b_lineclamp2">from bing</p>
  </li>
`;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function htmlResponse(status: number, html: string): Response {
  return new Response(html, { status, headers: { "content-type": "text/html" } });
}

test("Tavily success skips Bing", async () => {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("tavily.com")) {
      return jsonResponse(200, {
        results: [{ url: "https://example.com/tavily", title: "Tavily Hit", content: "from tavily" }],
      });
    }
    throw new Error(`unexpected ${url}`);
  };
  try {
    const result = await pluginSearch({ query: "dsh", apiKey: "tvly-test" });
    assert.equal(result.sources.length, 1);
    assert.equal(result.sources[0]?.url, "https://example.com/tavily");
    assert.equal(urls.some((url) => url.includes("bing.com")), false);
  } finally {
    globalThis.fetch = original;
  }
});

test("empty Tavily falls through to Bing", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("tavily.com")) return jsonResponse(200, { results: [] });
    if (url.includes("bing.com")) return htmlResponse(200, BING_HTML);
    throw new Error(`unexpected ${url}`);
  };
  try {
    const result = await pluginSearch({ query: "dsh" });
    assert.equal(result.sources[0]?.url, "https://example.com/bing");
    assert.equal(result.sources[0]?.title, "Bing Hit");
  } finally {
    globalThis.fetch = original;
  }
});

test("Tavily HTTP error falls through to Bing", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("tavily.com")) return jsonResponse(401, { error: "nope" });
    if (url.includes("bing.com")) return htmlResponse(200, BING_HTML);
    throw new Error(`unexpected ${url}`);
  };
  try {
    const result = await pluginSearch({ query: "dsh", apiKey: "tvly-bad" });
    assert.equal(result.sources[0]?.url, "https://example.com/bing");
  } finally {
    globalThis.fetch = original;
  }
});

test("both engines failing throw a combined error", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("tavily.com")) return jsonResponse(500, { error: "down" });
    if (url.includes("bing.com")) return htmlResponse(503, "nope");
    throw new Error(`unexpected ${url}`);
  };
  try {
    await assert.rejects(
      () => pluginSearch({ query: "dsh" }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /tavily:/);
        assert.match(error.message, /bing:/);
        return true;
      },
    );
  } finally {
    globalThis.fetch = original;
  }
});
