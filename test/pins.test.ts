import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PROVIDER_ID,
  isModelSearch,
  normalizeSearchMode,
  providerPins,
  resolveTavilyApiKey,
  searchModeOf,
  toolSearchReady,
} from "../dist/pins.js";

test("default search mode is model", () => {
  assert.equal(normalizeSearchMode(undefined), "model");
  assert.equal(normalizeSearchMode("model"), "model");
  assert.equal(normalizeSearchMode("tavily"), "tavily");
  assert.equal(normalizeSearchMode("deepseek"), "model");
  assert.equal(searchModeOf({}), "model");
});

test("pins stay on this provider and local fetch", () => {
  assert.deepEqual(providerPins(), {
    searchProvider: PROVIDER_ID,
    fetchProvider: "http",
  });
});

test("model mode hides the local web_search tool", () => {
  assert.equal(isModelSearch({ searchMode: "model" }), true);
  assert.equal(toolSearchReady({ searchMode: "model" }), false);
  assert.equal(isModelSearch({ searchMode: "tavily" }), false);
  assert.equal(toolSearchReady({ searchMode: "tavily" }), true);
});

test("Tavily key prefers config then env", () => {
  assert.equal(resolveTavilyApiKey({ tavilyApiKey: "  tvly-cfg  " }, { TAVILY_API_KEY: "tvly-env" }), "tvly-cfg");
  assert.equal(resolveTavilyApiKey({ tavilyApiKey: "" }, { TAVILY_API_KEY: "tvly-env" }), "tvly-env");
  assert.equal(resolveTavilyApiKey({}, {}), undefined);
});
