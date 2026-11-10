import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasLocalWebSearchTool,
  injectNativeSearchBody,
  isForcedLocalUrl,
  isChatCompletionsUrl,
  requestKind,
  rewriteChatCompletionsInit,
  rewriteModelSearchInit,
} from "../dist/native-inject.js";

const BASE = "http://192.168.3.100:3425";
const fn = { type: "function", function: { name: "web_fetch" } };

test("requestKind maps the three protocol paths and nothing else", () => {
  assert.equal(requestKind(`${BASE}/v1/chat/completions`), "chat");
  assert.equal(requestKind(`${BASE}/v1/chat/completions?x=1`), "chat");
  assert.equal(requestKind(`${BASE}/v1/responses`), "responses");
  assert.equal(requestKind(`${BASE}/v1/messages`), "messages");
  assert.equal(requestKind(`${BASE}/messages`), "messages");
  assert.equal(requestKind(`${BASE}/v1/models`), undefined);
  assert.equal(isChatCompletionsUrl(`${BASE}/v1/messages`), false);
});

test("chat adds only web_search_options and leaves tools alone", () => {
  const first = injectNativeSearchBody(JSON.stringify({ model: "m", messages: [], tools: [fn] }), "chat");
  assert.deepEqual(JSON.parse(first), { model: "m", messages: [], tools: [fn], web_search_options: {} });
  assert.equal(injectNativeSearchBody(first, "chat"), first);
});

test("chat is left alone when web_search_options already exists", () => {
  const body = JSON.stringify({ model: "m", tools: [fn], web_search_options: { search_context_size: "high" } });
  assert.equal(injectNativeSearchBody(body, "chat"), body);
});

test("responses appends a web_search tool, keeping function tools", () => {
  const out = JSON.parse(injectNativeSearchBody(JSON.stringify({ model: "m", input: [], tools: [fn] }), "responses"));
  assert.deepEqual(out.tools, [fn, { type: "web_search" }]);
  assert.equal(out.web_search_options, undefined);
});

test("messages appends web_search_20250305 with a name", () => {
  const out = JSON.parse(injectNativeSearchBody(JSON.stringify({ model: "m", messages: [], tools: [fn] }), "messages"));
  assert.deepEqual(out.tools, [fn, { type: "web_search_20250305", name: "web_search" }]);
  assert.equal(out.web_search_options, undefined);
});

test("requests without tools (session titles and other side calls) are left alone", () => {
  for (const kind of ["chat", "responses", "messages"] as const) {
    for (const body of [
      JSON.stringify({ model: "m", messages: [] }),
      JSON.stringify({ model: "m", tools: [] }),
      JSON.stringify({ model: "m", tools: null }),
    ]) {
      assert.equal(injectNativeSearchBody(body, kind), body);
    }
  }
});

test("an existing web_search* tool is not duplicated", () => {
  for (const [kind, type] of [["responses", "web_search"], ["messages", "web_search_20250305"], ["responses", "web_search_preview"]] as const) {
    const body = JSON.stringify({ model: "m", tools: [{ type }] });
    assert.equal(injectNativeSearchBody(body, kind), body);
  }
});

test("a non-array tools field and non-JSON bodies are skipped", () => {
  const odd = JSON.stringify({ model: "m", tools: "nope" });
  assert.equal(injectNativeSearchBody(odd, "messages"), odd);
  assert.equal(injectNativeSearchBody("not json", "chat"), "not json");
  assert.equal(injectNativeSearchBody("[]", "chat"), "[]");
});

test("rewriteModelSearchInit picks the shape from the URL and respects enabled", () => {
  const init = { method: "POST", body: JSON.stringify({ model: "x", tools: [fn] }) };
  const chat = rewriteModelSearchInit(`${BASE}/v1/chat/completions`, init, true);
  assert.deepEqual(JSON.parse(String(chat?.body)), { model: "x", tools: [fn], web_search_options: {} });
  const msg = rewriteModelSearchInit(`${BASE}/v1/messages`, init, true);
  assert.deepEqual(JSON.parse(String(msg?.body)).tools, [fn, { type: "web_search_20250305", name: "web_search" }]);
  assert.equal(rewriteModelSearchInit(`${BASE}/v1/models`, init, true), init);
  assert.equal(rewriteModelSearchInit(`${BASE}/v1/messages`, init, false), init);
  assert.equal(rewriteModelSearchInit(`${BASE}/v1/messages`, { method: "POST", body: new Uint8Array(2) }, true)?.body instanceof Uint8Array, true);
  assert.equal(rewriteChatCompletionsInit, rewriteModelSearchInit);
});

test("bodies without a model field are left alone (not an LLM request)", () => {
  const body = JSON.stringify({ text: "hi", tools: [fn] });
  for (const kind of ["chat", "responses", "messages"] as const) assert.equal(injectNativeSearchBody(body, kind), body);
});

test("either search marker blocks the other form", () => {
  const withTool = JSON.stringify({ model: "m", tools: [{ type: "web_search_preview" }] });
  assert.equal(injectNativeSearchBody(withTool, "chat"), withTool);
  const withOptions = JSON.stringify({ model: "m", tools: [fn], web_search_options: null });
  assert.equal(injectNativeSearchBody(withOptions, "chat"), withOptions);
  const msgs = JSON.stringify({ model: "m", tools: [fn], web_search_options: {} });
  assert.equal(injectNativeSearchBody(msgs, "messages"), msgs);
});

test("requestKind ignores a fragment and handles relative URLs", () => {
  assert.equal(requestKind("/v1/messages#frag"), "messages");
  assert.equal(requestKind("/v1/messages?x=1"), "messages");
});

test("a request that already lists the local web_search tool is never injected", () => {
  const shapes = {
    chat: { type: "function", function: { name: "web_search", parameters: {} } },
    responses: { type: "function", name: "web_search", parameters: {} },
    messages: { name: "web_search", input_schema: {} },
  } as const;
  for (const kind of ["chat", "responses", "messages"] as const) {
    const body = JSON.stringify({ model: "m", tools: [fn, shapes[kind]] });
    assert.equal(injectNativeSearchBody(body, kind), body);
  }
  assert.equal(hasLocalWebSearchTool([{ type: "web_search_20250305", name: "web_search" }]), false);
});

test("DeepSeek's own host is never injected", () => {
  assert.equal(isForcedLocalUrl("https://api.deepseek.com/anthropic/v1/messages"), true);
  assert.equal(isForcedLocalUrl("http://192.168.3.100:3425/v1/messages"), false);
  assert.equal(isForcedLocalUrl("/v1/messages"), false);
  const init = { method: "POST", body: JSON.stringify({ model: "x", tools: [fn] }) };
  assert.equal(rewriteModelSearchInit("https://api.deepseek.com/anthropic/v1/messages", init, true), init);
});

test("a rewritten request drops a stale content-length header", () => {
  const body = JSON.stringify({ model: "x", tools: [fn] });
  const out = rewriteModelSearchInit("http://h/v1/messages", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json", "Content-Length": String(body.length) },
  }, true);
  assert.deepEqual(out?.headers, { "Content-Type": "application/json" });
  const viaHeaders = rewriteModelSearchInit("http://h/v1/messages", {
    method: "POST",
    body,
    headers: new Headers({ "content-length": "1", "x-a": "1" }),
  }, true);
  assert.equal(new Headers(viaHeaders?.headers).get("content-length"), null);
  assert.equal(new Headers(viaHeaders?.headers).get("x-a"), "1");
});
