import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeHtml,
  parseBingHtml,
  parseDuckDuckGoHtml,
  unwrapRedirect,
} from "../dist/local-search.js";
import { DEEPSEEK_SEARCH, PROVIDER_ID, normalizeConfig, providerPins } from "../dist/pins.js";

test("decodeHtml strips tags and entities", () => {
  assert.equal(decodeHtml("A&nbsp;<b>B</b>&amp;C"), "A B&C");
});

test("unwrapRedirect reads DuckDuckGo uddg", () => {
  const href =
    "//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpath&rut=abc";
  assert.equal(unwrapRedirect(href, "https://html.duckduckgo.com/html/"), "https://example.com/path");
});

test("parseDuckDuckGoHtml keeps url title snippet", () => {
  const html = `
    <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Example</a>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">hello</a>
    <a class="result__a" href="">drop</a>
  `;
  const sources = parseDuckDuckGoHtml(html);
  assert.equal(sources.length, 1);
  assert.equal(sources[0]?.url, "https://example.com");
  assert.equal(sources[0]?.title, "Example");
  assert.equal(sources[0]?.snippet, "hello");
});

test("parseBingHtml reads b_algo blocks", () => {
  const html = `
    <li class="b_algo">
      <h2><a href="https://example.com/bing">Bing Hit</a></h2>
      <p class="b_lineclamp2">from bing</p>
    </li>
  `;
  const sources = parseBingHtml(html);
  assert.equal(sources.length, 1);
  assert.equal(sources[0]?.url, "https://example.com/bing");
  assert.equal(sources[0]?.title, "Bing Hit");
  assert.equal(sources[0]?.snippet, "from bing");
});

test("default pins are plugin search + http fetch", () => {
  assert.deepEqual(providerPins({}), {
    searchProvider: PROVIDER_ID,
    fetchProvider: "http",
  });
});

test("switches are plugin vs DeepSeek for search and fetch", () => {
  assert.deepEqual(
    providerPins({ searchBackend: "plugin", fetchBackend: "plugin" }),
    { searchProvider: PROVIDER_ID, fetchProvider: "http" },
  );
  assert.deepEqual(
    providerPins({ searchBackend: "deepseek", fetchBackend: "deepseek" }),
    { searchProvider: DEEPSEEK_SEARCH, fetchProvider: "deepseek-fetch-api" },
  );
  assert.deepEqual(
    providerPins({ searchBackend: "plugin", fetchBackend: "deepseek" }),
    { searchProvider: PROVIDER_ID, fetchProvider: "deepseek-fetch-api" },
  );
  assert.deepEqual(normalizeConfig({ searchBackend: "deepseek" }), {
    searchBackend: "deepseek",
    fetchBackend: "plugin",
  });
  assert.deepEqual(normalizeConfig({ searchBackend: "native", fetchBackend: "local" }), {
    searchBackend: "plugin",
    fetchBackend: "plugin",
  });
});
