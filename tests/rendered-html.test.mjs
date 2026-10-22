import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds the disaster-support application rather than the starter shell", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  assert.match(page, /令和8年熊本地震/);
  assert.match(page, /SupportPoint/);
  assert.match(layout, /むすび｜令和8年熊本地震 支援情報システム/);
  assert.doesNotMatch(page + layout, /Your site is taking shape|codex-preview/);
  await access(new URL("dist/server/index.js", root));
});

