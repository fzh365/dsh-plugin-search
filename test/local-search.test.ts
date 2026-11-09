import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeHtml, parseBingHtml, unwrapRedirect } from "../dist/local-search.js";

test("decodeHtml strips tags and entities", () => {
  assert.equal(decodeHtml("A&nbsp;<b>B</b>&amp;C"), "A B&C");
});

test("unwrapRedirect reads encoded u parameter", () => {
  const href = "https://www.bing.com/ck/a?u=https%3A%2F%2Fexample.com%2Fpath";
  assert.equal(unwrapRedirect(href, "https://www.bing.com/"), "https://example.com/path");
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
