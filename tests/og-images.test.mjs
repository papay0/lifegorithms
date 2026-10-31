import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");
const matter = require("gray-matter");
const baselineRef = "e65e02de37e4d5993c3fb389fd9cc26fefd77b2a";
const legacySource = execFileSync("git", ["show", `${baselineRef}:app/api/og/route.tsx`], {
  cwd: root,
  encoding: "utf8",
});
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Evaluate repository TS/TSX in memory, without another runner or emitted files.
const modules = new Map();
function evaluate(source, filename, overrides = {}) {
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const evaluatedModule = { exports: {} };
  const resolve = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith("@/")) return load(name.slice(2));
    return require(name);
  };
  new Function("exports", "require", "module", outputText)(evaluatedModule.exports, resolve, evaluatedModule);
  return evaluatedModule.exports;
}
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const filename = [relative, `${relative}.ts`, `${relative}.tsx`]
    .map((name) => path.join(root, name))
    .find((name) => {
      try { return readFileSync(name).length > 0; } catch { return false; }
    });
  assert.ok(filename, `Missing TypeScript module: ${relative}`);
  const exports = evaluate(readFileSync(filename, "utf8"), filename);
  modules.set(relative, exports);
  return exports;
}

const { getDefaultOgImage, getPostOgImage, getStaticOgImages } = load("lib/og-images");
const { OgImage, readOgImageContent } = load("lib/og-image");
const posts = readdirSync(path.join(root, "content/posts"))
  .flatMap((year) => readdirSync(path.join(root, "content/posts", year))
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => ({
      ...matter(readFileSync(path.join(root, "content/posts", year, file), "utf8")).data,
      year,
      slug: file.replace(/\.mdx?$/, ""),
    })))
  .filter((post) => !post.draft);

function postQuery(post) {
  const query = new URLSearchParams({ title: post.title });
  if (post.emoji) query.set("emoji", post.emoji);
  if (post.description) query.set("description", post.description);
  return `?${query}`;
}
const variants = [
  { page: "/", image: getDefaultOgImage(), query: "", title: "Lifegorithms" },
  ...posts.map((post) => ({
    page: `/blog/${post.year}/${post.slug}`,
    image: getPostOgImage(post),
    query: postQuery(post),
    title: post.title,
  })),
];
const defaults = {
  title: "Lifegorithms",
  emoji: "✨",
  description: "Stories • Insights • Adventures",
};
const queryCases = [
  { query: "", expected: defaults },
  { query: "?title=&emoji=&description=", expected: defaults },
  {
    query: "?title=Encoded%2520title&emoji=%25E2%259C%25A8&description=100%2525%20complete",
    expected: { title: "Encoded title", emoji: "✨", description: "100% complete" },
  },
  {
    query: "?title=First&title=Second&emoji=&emoji=ignored&description=&description=ignored",
    expected: { ...defaults, title: "First" },
  },
  {
    query: "?title=Words+with+spaces&description=A%26B%3DC%2BD%23E",
    expected: { ...defaults, title: "Words with spaces", description: "A&B=C+D#E" },
  },
];

test("published posts and default have unique, deterministic, revisioned image URLs", () => {
  const images = getStaticOgImages();
  assert.equal(images.length, posts.length + 1);
  assert.equal(new Set(images.map(({ id }) => id)).size, images.length);
  assert.deepEqual(images.map(({ id }) => id).sort(), variants.map(({ image }) => image.id).sort());
  for (const { image } of variants) {
    const url = new URL(image.url, "https://www.lifegorithms.com");
    assert.equal(url.pathname, `/og/${image.id}`);
    assert.match(url.searchParams.get("v"), /^[0-9a-f]{16}$/);
    assert.deepEqual([...url.searchParams.keys()], ["v"]);
  }
  assert.equal(getDefaultOgImage().id, "default");
  for (const post of posts) assert.equal(getPostOgImage(post).id, `${post.year}-${post.slug}`);
  const post = posts.find(({ slug }) => slug === "SoTrade");
  assert.ok(post, "case-sensitive SoTrade fixture missing");
  assert.equal(getPostOgImage(post).id, "2021-SoTrade");
  assert.deepEqual(getPostOgImage(post), getPostOgImage({ ...post }));
  for (const key of ["title", "emoji", "description"]) {
    const changed = getPostOgImage({ ...post, [key]: `${post[key]} changed` });
    assert.equal(changed.id, getPostOgImage(post).id, "content changes must preserve the existing path");
    assert.notEqual(getPostOgImage(post).url, changed.url);
  }
});

test("query defaults, double decoding, duplicate keys, and malformed escapes retain legacy behavior", () => {
  for (const { query, expected } of queryCases) {
    assert.deepEqual(readOgImageContent(new URLSearchParams(query)), expected, query);
  }
  for (const field of ["title", "emoji", "description"]) {
    assert.throws(() => readOgImageContent(new URLSearchParams(`${field}=%25`)), URIError, field);
  }
});

test("shared JSX matches the original committed handler for every published variant", async () => {
  class CapturedImageResponse extends Response {
    constructor(element, options) {
      super(null);
      this.element = element;
      this.options = options;
    }
  }
  const legacy = evaluate(legacySource, "legacy-og.tsx", { "next/og": { ImageResponse: CapturedImageResponse } });
  for (const { query } of [...variants, ...queryCases]) {
    const expected = await legacy.GET(new Request(`http://localhost/api/og${query}`));
    assert.equal(expected.status, 200, query);
    assert.equal(expected.options.width, 1200);
    assert.equal(expected.options.height, 630);
    assert.deepEqual(OgImage(readOgImageContent(new URLSearchParams(query))), expected.element, query);
  }
});

// Opt-in integration suite: BASE_URL=http://127.0.0.1:3100 node --test tests/og-images.test.mjs
// Requires next build + next start. It renders legacy images locally, including
// the renderer's normal pinned emoji downloads; never point this at production.
const base = process.env.BASE_URL;
if (base) {
  const url = new URL(base);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "OG integration tests require a local server");
  assert.ok(["http:", "https:"].includes(url.protocol));
  assert.equal(url.username + url.password + url.search + url.hash, "");
}
const requestLocal = (pathname, options) => fetch(new URL(pathname, base), { redirect: "error", ...options });
const legacy = base ? evaluate(legacySource, "legacy-og.tsx") : null;
const oracle = new Map();
async function pixels(response, label) {
  assert.equal(response.status, 200, label);
  assert.match(response.headers.get("content-type") || "", /^image\/png(?:;|$)/, label);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sharp = require("sharp");
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1200, label);
  assert.equal(info.height, 630, label);
  assert.equal(info.channels, 4, label);
  return { pixelHash: digest(data), pngHash: digest(bytes) };
}
async function originalPixels(query) {
  if (!oracle.has(query)) {
    oracle.set(query, pixels(await legacy.GET(new Request(`http://localhost/api/og${query}`)), `original ${query}`));
  }
  return oracle.get(query);
}

test("production build prerenders exactly the known OG variants without regeneration or fallback", { skip: !base }, () => {
  const manifest = JSON.parse(readFileSync(path.join(root, ".next/prerender-manifest.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest.routes).filter((route) => route.startsWith("/og/")).sort(), variants.map(({ image }) => new URL(image.url, base).pathname).sort());
  assert.equal(manifest.dynamicRoutes["/og/[id]"].fallback, false);
  assert.ok(!Object.hasOwn(manifest.routes, "/api/og"), "arbitrary query API must remain dynamic");
  for (const { image } of variants) assert.equal(manifest.routes[new URL(image.url, base).pathname].initialRevalidateSeconds, false, image.url);
});

test("every static PNG and legacy Edge API match original pixels, with correct page metadata", { skip: !base, timeout: 360_000 }, async (t) => {
  const { JSDOM } = require("jsdom");
  for (const { page, image, query, title } of variants) {
    await t.test(page, async () => {
      const response = await requestLocal(page);
      assert.equal(response.status, 200, page);
      const dom = new JSDOM(await response.text());
      const document = dom.window.document;
      for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
        const metadataUrl = new URL(document.querySelector(selector)?.content);
        const expectedUrl = new URL(image.url, "https://www.lifegorithms.com");
        assert.equal(metadataUrl.origin, "https://www.lifegorithms.com", page);
        assert.equal(metadataUrl.pathname, expectedUrl.pathname, page);
        assert.equal(metadataUrl.search, expectedUrl.search, page);
      }
      assert.equal(document.querySelector('meta[property="og:image:width"]')?.content, "1200", page);
      assert.equal(document.querySelector('meta[property="og:image:height"]')?.content, "630", page);
      assert.equal(document.querySelector('meta[property="og:image:alt"]')?.content, title, page);
      dom.window.close();
      const expected = await originalPixels(query);
      const rendered = await requestLocal(image.url);
      assert.equal(rendered.headers.get("x-nextjs-cache"), "HIT", image.url);
      assert.equal((await pixels(rendered, image.url)).pixelHash, expected.pixelHash, `static pixels changed: ${page}`);
      const api = await requestLocal(`/api/og${query}`);
      assert.equal(api.headers.get("cache-control"), "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
      assert.equal((await pixels(api, query)).pixelHash, expected.pixelHash, `Edge/API pixels changed: ${page}`);
    });
  }
});

test("arbitrary API queries, defaults, double encoding, and errors still work", { skip: !base, timeout: 180_000 }, async () => {
  const queries = [
    "?title=Cache%20Alpha&emoji=%E2%9C%A8&description=First%20description",
    "?title=Cache%20Beta&emoji=%F0%9F%8C%8D&description=Second%20description",
    ...queryCases.map(({ query }) => query),
  ];
  const hashes = [];
  for (const query of queries) {
    const actual = await pixels(await requestLocal(`/api/og${query}`), query);
    assert.equal(actual.pixelHash, (await originalPixels(query)).pixelHash, query);
    hashes.push(actual.pixelHash);
  }
  assert.notEqual(hashes[0], hashes[1], "different custom text must produce distinct images");
  for (const field of ["title", "emoji", "description"]) {
    const response = await requestLocal(`/api/og?${field}=%25`);
    assert.equal(response.status, 500, field);
    assert.doesNotMatch(response.headers.get("cache-control") || "", /s-maxage=86400/);
    assert.equal(await response.text(), "Failed to generate OG image");
  }
});

test("unknown IDs return 404 while older revisions and extra queries retain the known image", { skip: !base }, async () => {
  const known = getDefaultOgImage();
  for (const url of ["/og/does-not-exist", "/og/default-missing", "/og/unknown-post"]) {
    const response = await requestLocal(url);
    assert.equal(response.status, 404, url);
    await response.arrayBuffer();
  }
  const expected = await originalPixels("");
  const changedQuery = new URL(known.url, base);
  changedQuery.searchParams.set("title", "Changed");
  changedQuery.searchParams.set("emoji", "ignored");
  const response = await requestLocal(changedQuery);
  assert.equal((await pixels(response, known.url)).pixelHash, expected.pixelHash);
  const oldRevision = new URL(known.url, base);
  oldRevision.searchParams.set("v", "0000000000000000");
  assert.equal((await pixels(await requestLocal(oldRevision), "older revision")).pixelHash, expected.pixelHash);
  assert.equal((await pixels(await requestLocal(oldRevision.pathname), "unversioned path")).pixelHash, expected.pixelHash);
  const head = await requestLocal(known.url, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.match(head.headers.get("content-type") || "", /^image\/png/);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
});
