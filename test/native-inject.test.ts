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
});

test("injectNativeSearchBody adds web_search_options once", () => {
  const first = injectNativeSearchBody(JSON.stringify({ model: "group/deepseek-flash", messages: [] }));
  assert.deepEqual(JSON.parse(first), {
    model: "group/deepseek-flash",
    messages: [],
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
  assert.equal(JSON.parse(String(rewritten?.body)).web_search_options !== undefined, true);
  const skipped = rewriteChatCompletionsInit(
    "http://192.168.3.100:3425/v1/models",
    init,
    true,
  );
  assert.equal(skipped, init);
  const off = rewriteChatCompletionsInit(
    "http://192.168.3.100:3425/v1/chat/completions",
    init,
    false,
  );
  assert.equal(off, init);
});
