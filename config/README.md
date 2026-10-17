# Legacy media URLs

`media-aliases.json` maps former public file paths to byte-identical retained files.
Keep these aliases: old links and cached Next Image source URLs may still use them.
Current articles already reference the retained files.

`next.config.ts` uses static, filesystem-first rewrites rather than redirects so
old image optimizer requests and video byte ranges still work. Its bounded
patterns also accept percent-encoded unreserved filename characters, as static
files do. Destinations are fixed; there is no middleware or application handler.
Next appends the captured path to the internal query; static-file responses ignore
it, and existing query parameters are covered by the compatibility tests.

The initial cleanup removes 208 duplicate paths (910,711,475 bytes), reducing
`public` from 1,015 files / 2,281,372,933 bytes to 807 files / 1,370,661,458 bytes.
Every removed file had the same Git blob as its retained destination. This is a
pathname payload reduction, not a measured reduction in Vercel billed storage.
Git history retains the original paths and already deduplicates identical blobs.
The retained image/video bytes and normal visitor transfer sizes do not change.

Run compatibility tests against a local production server:

```sh
npm run build
npm run start -- --port 3100
# In a second terminal:
BASE_URL=http://localhost:3100 node --test tests/media-aliases.test.mjs
```

The HTTP suite reads approximately 911 MB locally, checks every alias and every
legacy image optimizer source, and tests video seeking. Do not run the full suite
against metered production hosting. Without `BASE_URL`, only the filesystem checks
run. Unsatisfiable ranges are compared with the canonical handler: Next 16.1.1's
local server currently returns 500 for both; valid ranges return 206.
