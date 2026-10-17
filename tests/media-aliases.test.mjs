import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const aliases = JSON.parse(await readFile(new URL("../config/media-aliases.json", import.meta.url), "utf8"));
const base = process.env.BASE_URL;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const targetPath = (alias) => path.join(root, "public", alias.destination);
const mime = (url) => /\.mp4$/i.test(url) ? "video/mp4" : /\.png$/i.test(url) ? "image/png" : "image/jpeg";

async function each(items, action, concurrency = 4) {
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) await action(items[cursor++]);
  }));
}

test("every exact alias resolves directly to a surviving public file", async () => {
  assert.ok(aliases.length > 0);
  const sources = new Set(aliases.map(({ source }) => source));
  assert.equal(sources.size, aliases.length, "duplicate source URL");
  for (const alias of aliases) {
    for (const url of [alias.source, alias.destination]) {
      assert.match(url, /^\/images\/[A-Za-z0-9_./-]+$/);
      assert.ok(!url.split("/").includes(".."));
    }
    assert.ok(!sources.has(alias.destination), `rewrite chain: ${alias.source}`);
    assert.ok((await stat(targetPath(alias))).isFile(), alias.destination);
    await assert.rejects(stat(path.join(root, "public", alias.source)), { code: "ENOENT" });
    assert.equal(mime(alias.source), mime(alias.destination), alias.source);
  }
});

test("built rewrite patterns stay bounded and do not match nearby filenames", { skip: !base }, async () => {
  const manifest = JSON.parse(await readFile(path.join(root, ".next/routes-manifest.json"), "utf8"));
  const routes = manifest.rewrites.afterFiles;
  assert.equal(routes.length, aliases.length);
  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i];
    const route = routes[i];
    assert.equal(route.destination, alias.destination);
    assert.ok(route.regex.length <= 4096, alias.source);
    const matcher = new RegExp(route.regex, manifest.caseSensitive ? "" : "i");
    const lowerEncoded = alias.source.replace(/[A-Za-z0-9_.-]/g, (character) => `%${character.charCodeAt(0).toString(16)}`);
    assert.ok(matcher.test(alias.source));
    assert.ok(matcher.test(lowerEncoded));
    assert.ok(!matcher.test(alias.source + ".missing"));
    assert.ok(!matcher.test(alias.source + "/missing"));
  }
});

// Run against a local production build: BASE_URL=http://localhost:3100 node --test tests/media-aliases.test.mjs
// Full payload checks intentionally read ~911 MB; avoid running these against metered production hosting.
test("legacy media URLs retain bytes, HEAD, queries, MIME, and conditional caching", { skip: !base }, async () => {
  await each(aliases, async (alias) => {
    const expected = await readFile(targetPath(alias));
    const response = await fetch(base + alias.source, { redirect: "error" });
    assert.equal(response.status, 200, alias.source);
    assert.equal(response.headers.get("content-type")?.split(";")[0], mime(alias.source));
    assert.equal(response.headers.get("content-length"), String(expected.length));
    const digest = createHash("sha256");
    for await (const chunk of response.body) digest.update(chunk);
    assert.equal(digest.digest("hex"), hash(expected), alias.source);
    const head = await fetch(base + alias.source + "?legacy=1&legacy=2&legacyMedia=existing", { method: "HEAD", redirect: "error" });
    assert.equal(head.status, 200, alias.source);
    assert.equal(head.headers.get("content-length"), String(expected.length));
    assert.equal(head.headers.get("content-type"), response.headers.get("content-type"));
    assert.equal(head.headers.get("cache-control"), response.headers.get("cache-control"));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    // Raw-file routing also accepts unnecessary percent encoding of ordinary filename letters.
    const encodedSource = alias.source.replace(/[A-Za-z0-9_.-]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    const encoded = await fetch(base + encodedSource, { method: "HEAD", redirect: "error" });
    assert.equal(encoded.status, 200, encodedSource);
    assert.equal(encoded.headers.get("content-length"), String(expected.length));
    assert.equal(encoded.headers.get("etag"), response.headers.get("etag"));
    const partialSource = alias.source.replace(/[^/]+$/, (name) => name.replace(/[A-Za-z]/, (character) => `%${character.charCodeAt(0).toString(16)}`));
    const partial = await fetch(base + partialSource, { method: "HEAD", redirect: "error" });
    assert.equal(partial.status, 200, partialSource);
    assert.equal(partial.headers.get("etag"), response.headers.get("etag"));
    const etag = response.headers.get("etag");
    assert.ok(etag, alias.source);
    // Prevent Node fetch from adding Cache-Control: no-cache to a conditional request.
    const conditional = await fetch(base + alias.source, { headers: { "If-None-Match": etag }, cache: "force-cache" });
    assert.equal(conditional.status, 304, alias.source);
  });
});

test("every legacy video preserves byte-accurate seeking and range response behavior", { skip: !base }, async () => {
  await each(aliases.filter(({ source }) => /\.mp4$/i.test(source)), async (alias) => {
    const expected = await readFile(targetPath(alias));
    for (const start of [0, Math.floor(expected.length / 2), Math.max(0, expected.length - 1024)]) {
      const end = Math.min(start + 1023, expected.length - 1);
      const response = await fetch(base + alias.source, { headers: { Range: `bytes=${start}-${end}` } });
      assert.equal(response.status, 206, alias.source);
      assert.equal(response.headers.get("content-range"), `bytes ${start}-${end}/${expected.length}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected.subarray(start, end + 1));
    }
    const suffix = await fetch(base + alias.source, { headers: { Range: "bytes=-1024" } });
    assert.equal(suffix.status, 206, alias.source);
    assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), expected.subarray(-1024));
    const invalid = await fetch(base + alias.source, { headers: { Range: `bytes=${expected.length}-` } });
    const canonicalInvalid = await fetch(base + alias.destination, { headers: { Range: `bytes=${expected.length}-` } });
    // next start currently returns 500 for unsatisfiable static ranges; Vercel may return 416.
    // The compatibility route must preserve the unchanged canonical handler's behavior.
    assert.equal(invalid.status, canonicalInvalid.status, alias.source);
    assert.equal(invalid.headers.get("content-range"), canonicalInvalid.headers.get("content-range"));
    await invalid.arrayBuffer();
    await canonicalInvalid.arrayBuffer();
  });
});

test("all legacy Next Image source URLs still optimize to identical images", { skip: !base }, async () => {
  await each(aliases.filter(({ source }) => !/\.mp4$/i.test(source)), async (alias) => {
    const optimize = async (url) => {
      const query = new URLSearchParams({ url, w: "96", q: "75" });
      const response = await fetch(`${base}/_next/image?${query}`);
      assert.equal(response.status, 200, url);
      assert.match(response.headers.get("content-type"), /^image\//);
      return hash(Buffer.from(await response.arrayBuffer()));
    };
    assert.equal(await optimize(alias.source), await optimize(alias.destination), alias.source);
  }, 2);
});
