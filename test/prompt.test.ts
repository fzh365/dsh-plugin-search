import assert from "node:assert/strict";
import { test } from "node:test";
import { composeSearchPrompt, currentMonthYear } from "../dist/prompt.js";

const now = new Date(2026, 10, 15);

test("currentMonthYear is month plus year", () => {
  assert.equal(currentMonthYear(now), "November 2026");
});

test("model prompt tells the model to call a listed web_search tool", () => {
  const text = composeSearchPrompt("model", now);
  assert.match(text, /model API/i);
  assert.match(text, /web_search tool is listed, call it/i);
  assert.equal(/no local web_search tool/i.test(text), false);
  assert.match(text, /web_fetch/);
  assert.match(text, /Sources/);
  assert.match(text, /November 2026/);
  assert.equal(/do not fetch/i.test(text), false);
  assert.equal(text.includes("google.com"), false);
  assert.equal(text.includes("magpie"), false);
});

test("tavily prompt describes Tavily then Bing", () => {
  const text = composeSearchPrompt("tavily", now);
  assert.match(text, /Tavily first, then Bing/);
  assert.match(text, /web_search tool/);
  assert.match(text, /Sources/);
  assert.match(text, /untrusted/);
  assert.equal(/do not fetch/i.test(text), false);
  assert.equal(text.includes("google.com"), false);
  assert.equal(text.includes("magpie"), false);
});
