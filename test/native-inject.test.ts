import assert from "node:assert/strict";
import { test } from "node:test";
import {
  injectNativeSearchBody,
  isChatCompletionsUrl,
  requestKind,
  rewriteModelSearchInit,
} from "../dist/native-inject.js";

test("requestKind classifies model endpoints", () => {
  assert.equal(requestKind("http://192.168.3.100:3425/v1/chat/completions"), "chat");
  assert.equal(requestKind("http://192.168.3.100:3425/v1/chat/completions?foo=1"), "chat");
  assert.equal(requestKind("http://192.168.3.100:3425/v1/responses"), "responses");
  assert.equal(requestKind("http://192.168.3.100:3425/v1/messages"), "messages");
  assert.equal(
    requestKind("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"),
    "gemini",
  );
  assert.equal(requestKind("http://192.168.3.100:3425/v1/models"), undefined);
});

test("isChatCompletionsUrl matches /v1/chat/completions", () => {
  assert.equal(isChatCompletionsUrl("http://192.168.3.100:3425/v1/chat/completions"), true);
  assert.equal(isChatCompletionsUrl("http://192.168.3.100:3425/v1/messages"), false);
});

test("chat completions get web_search_options and tools type web_search", () => {
  const first = injectNativeSearchBody(JSON.stringify({ model: "group/deepseek-flash", messages: [] }));
  assert.deepEqual(JSON.parse(first), {
    model: "group/deepseek-flash",
    messages: [],
    web_search_options: {},
    tools: [{ type: "web_search" }],
  });
  assert.equal(injectNativeSearchBody(first), first);
});

test("chat completions keep function tools and skip a second native web_search", () => {
  const body = JSON.stringify({
    model: "x",
    tools: [
      { type: "function", function: { name: "web_fetch" } },
      { type: "web_search_preview" },
    ],
  });
  const parsed = JSON.parse(injectNativeSearchBody(body));
  assert.deepEqual(parsed.web_search_options, {});
  assert.deepEqual(parsed.tools, [
    { type: "function", function: { name: "web_fetch" } },
    { type: "web_search_preview" },
  ]);
});

test("responses get tools type web_search", () => {
  const parsed = JSON.parse(injectNativeSearchBody(JSON.stringify({ model: "x", input: [] }), "responses"));
  assert.deepEqual(parsed.tools, [{ type: "web_search" }]);
  assert.equal(parsed.web_search_options, undefined);
});

test("anthropic messages get web_search_20250305", () => {
  const parsed = JSON.parse(
    injectNativeSearchBody(JSON.stringify({ model: "x", messages: [], max_tokens: 16 }), "messages"),
  );
  assert.deepEqual(parsed.tools, [{ type: "web_search_20250305", name: "web_search" }]);
});

test("gemini get googleSearch", () => {
  const parsed = JSON.parse(injectNativeSearchBody(JSON.stringify({ contents: [] }), "gemini"));
  assert.deepEqual(parsed.tools, [{ googleSearch: {} }]);
});

test("rewriteModelSearchInit only rewrites model endpoints when enabled", () => {
  const init = { method: "POST", body: JSON.stringify({ model: "x" }) };
  const rewritten = rewriteModelSearchInit(
    "http://192.168.3.100:3425/v1/chat/completions",
    init,
    true,
  );
  const body = JSON.parse(String(rewritten?.body));
  assert.deepEqual(body.web_search_options, {});
  assert.deepEqual(body.tools, [{ type: "web_search" }]);
  const messages = rewriteModelSearchInit(
    "http://192.168.3.100:3425/v1/messages",
    init,
    true,
  );
  assert.deepEqual(JSON.parse(String(messages?.body)).tools, [
    { type: "web_search_20250305", name: "web_search" },
  ]);
  const skipped = rewriteModelSearchInit("http://192.168.3.100:3425/v1/models", init, true);
  assert.equal(skipped, init);
  const off = rewriteModelSearchInit("http://192.168.3.100:3425/v1/chat/completions", init, false);
  assert.equal(off, init);
});
