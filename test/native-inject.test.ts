import assert from "node:assert/strict";
import { test } from "node:test";
import {
  injectNativeSearchBody,
  isChatCompletionsUrl,
  rewriteChatCompletionsInit,
} from "../dist/native-inject.js";

test("isChatCompletionsUrl matches /v1/chat/completions", () => {
  assert.equal(isChatCompletionsUrl("http://192.168.3.100:3425/v1/chat/completions"), true);
  assert.equal(isChatCompletionsUrl("http://192.168.3.100:3425/v1/chat/completions?foo=1"), true);
  assert.equal(isChatCompletionsUrl("http://192.168.3.100:3425/v1/models"), false);
  assert.equal(isChatCompletionsUrl("http://192.168.3.100:3425/v1/messages"), false);
});

test("injectNativeSearchBody adds web_search_options once and leaves tools alone", () => {
  const first = injectNativeSearchBody(
    JSON.stringify({
      model: "group/deepseek-flash",
      messages: [],
      tools: [{ type: "function", function: { name: "web_fetch" } }],
    }),
  );
  assert.deepEqual(JSON.parse(first), {
    model: "group/deepseek-flash",
    messages: [],
    tools: [{ type: "function", function: { name: "web_fetch" } }],
    web_search_options: {},
  });
  assert.equal(injectNativeSearchBody(first), first);
});

test("rewriteChatCompletionsInit only rewrites completions JSON", () => {
  const init = { method: "POST", body: JSON.stringify({ model: "x" }) };
  const rewritten = rewriteChatCompletionsInit(
    "http://192.168.3.100:3425/v1/chat/completions",
    init,
    true,
  );
  assert.deepEqual(JSON.parse(String(rewritten?.body)), {
    model: "x",
    web_search_options: {},
  });
  const skipped = rewriteChatCompletionsInit("http://192.168.3.100:3425/v1/models", init, true);
  assert.equal(skipped, init);
  const messages = rewriteChatCompletionsInit("http://192.168.3.100:3425/v1/messages", init, true);
  assert.equal(messages, init);
  const off = rewriteChatCompletionsInit("http://192.168.3.100:3425/v1/chat/completions", init, false);
  assert.equal(off, init);
});
