import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  }));
  return nested.flat();
}

test("public external links respond successfully", async () => {
  const files = (await filesUnder("app")).filter((file) => /\.(tsx|ts)$/.test(file));
  const urls = new Set();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/https:\/\/[^"'`\s)]+/g)) {
      const url = match[0];
      if (url.includes("{z}") || url.includes("app.local") || url.includes("supabase.co")) continue;
      urls.add(url);
    }
  }

  const failures = [];
  for (const url of urls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "musubi-link-check/1.0" },
      });
      if (response.status === 403 || response.status === 405) {
        response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: { "user-agent": "Mozilla/5.0 musubi-link-check/1.0" },
        });
      }
      if (response.status >= 400) failures.push(`${response.status} ${url}`);
    } catch (error) {
      failures.push(`${error instanceof Error ? error.message : "request failed"} ${url}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  assert.deepEqual(failures, [], `Broken external links:\n${failures.join("\n")}`);
});
