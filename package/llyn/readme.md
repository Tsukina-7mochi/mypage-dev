# Llyn

Llyn is a website build framework based on island architecture. Llyn is designed
to minimize client code and response time. Llyn is built on Deno and configured
to be deployed on Cloudflare Workers.

## Usage

### Configuration

Llyn reads `llyn.config.ts` (or `.js` / `.mjs`) from the current directory.

```ts
import { defineConfig } from "llyn/core";

export default defineConfig({
  root: "./routes",
  dist: "./dist",
  documents: ["**/*.html", "**/*.md"],
  documentsExclude: ["**/template.html"],
  public: "./routes/public",
  worker: "./src/main.ts",
});
```

- `root`: base directory of documents and island specifiers
- `dist`: output directory
- `documents` / `documentsExclude`: globs relative to `root`
- `public`: directory copied to `dist/static/<basename>/` (optional)
- `worker`: server entry point

### Build

Run `package/llyn/core/main.ts` to build. It processes documents into
`dist/static/`, bundles client code with code splitting, and bundles the worker
entry into `dist/worker.js`. Every run is a full build.

- `--dev`: skip minification and emit inline source maps
- `--live-reload`: insert the live reload client into documents and serve the
  boot id of the build from `serveLiveReload`

### Documents

Documents (HTML and Markdown) are the entry points. Resources referenced by
documents are included in the bundle.

- client island: `<script type="application/client-island" src>`
- server island: `<script type="application/server-island" src>`
- static island: `<script type="application/static-island" src>`
- scripts: `<script src>` with a regular `type` (emitted as ES modules)
- css: `<link rel="stylesheet">`

Markdown frontmatter is written in YAML and inserted into the HTML according to
its keys. A Markdown document uses the template given by the `template`
frontmatter key (a path relative to the document), defaulting to
`template.html`. See `core/resources/markdown/frontmatter.ts` for the supported
keys.

### Islands

Islands are collected from the script tags of documents; they are not listed in
the configuration. The island id is the first 8 hex digits of the SHA-1 of its
specifier (the normalized path relative to `root`, separated by `/`). Islands
outside `root` are allowed. An id collision raises an error.

The remaining attributes of a script tag become string props. Attribute names
starting with `_` are reserved and are not passed as props. Every island
receives `_prerender: boolean`, which is `true` only during prerendering.

- client island: prerendered at build time and hydrated on the client. Props are
  embedded in the page bootstrap.
- server island: rendered at build time as a fallback, then fetched from
  `/_islands/<id>?<props>` after the page loads.
- static island: rendered at build time (async components are supported) and
  never hydrated or fetched.

### Runtime

The server code imports `llyn/runtime`. The same code runs in dev and prod.

```ts
import { serveIsland, serveLiveReload, startDevBuild } from "llyn/runtime";

const ctx = await startDevBuild();

const app = new Hono()
  .all("/_islands/*", (c) => serveIsland(c.req.raw, ctx))
  .get("/__reload", (c) => serveLiveReload(c.req.raw, ctx));
```

- `startDevBuild()`: in dev, runs a full client build with live reload and
  returns a `DevContext`. In prod, returns `undefined`.
- `serveIsland(req, ctx)`: renders a server island.
- `serveLiveReload(req, ctx)`: in dev, sends the boot id over SSE. In prod,
  returns 404.

`DevContext.staticDir` is the absolute path of `dist/static/` in dev. In prod,
resolve static files from the bundled worker location instead.

### Dev server

Run the server entry with `deno serve --watch=<root>,llyn.config.ts`. Any change
restarts the process, which rebuilds once at startup. The live reload client
keeps the first boot id and reloads the page when a different one arrives after
reconnecting. A failed build exits the process; `deno serve --watch` waits for
the next change.

## For Developers

### Package boundaries

- `runtime/`: `llyn/runtime`. The dev implementation lives here. In prod builds
  `core/esbuildPlugin/llynRuntimePlugin.ts` replaces the whole module with
  generated code, so no build dependency is bundled into the worker.
- `core/`: production build CLI, config loading, document collection, document
  processing, island id, prerender, and code generation.

### Build flow

1. `runBuild(config, options)` (`core/runBuild.ts`) collects documents
   (`core/collect.ts`) and creates a `Context` (`core/context.ts`).
2. Documents flow through the HTML / Markdown processors, which call the island
   prerenderers and the build asset processor directly. Each processor returns a
   `DocumentOutput` (source files, virtual files for page bootstraps, and island
   instances), and `runBuild` merges them and checks island id collisions.
3. esbuild bundles client code into `dist/static/` (ESM, code splitting into
   `chunks/`), and bundles the worker entry into `dist/worker.js` with the
   generated runtime. In parallel, `copyPublic` (`core/copyPublic.ts`) copies
   `public` to `dist/static/<basename>/`.
4. `runBuild` returns the server islands, which `startDevBuild` turns into
   `DevContext`.

### Key files

- `core/`
  - `index.ts`: re-exports
  - `runBuild.ts`: `runBuild`
  - `main.ts`: production build CLI
  - `config.ts`: config schema, `defineConfig`, `loadConfig`, `getStaticDist`
  - `collect.ts`: document collection and `DocumentEntry`
  - `copyPublic.ts`: copies `public` under `dist/static/`
  - `island.ts`: `Island`, `IslandInstance`, island id, `createIsland`, and
    server island extraction
  - `context.ts`: `Context`
  - `documentOutput.ts`: `DocumentOutput` and `mergeDocumentOutputs`
  - `resources/processor.ts`: `processDocument` dispatch by document type
  - `resources/html/processor.ts`: island prerender, DOM rewrite, bootstrap
  - `resources/html/helper.ts`: DOM queries for islands, scripts, styles
  - `resources/html/liveReload.ts`: live reload client script
  - `resources/markdown/processor.ts`: frontmatter, marked, template merge
  - `resources/markdown/frontmatter.ts`: frontmatter schema
  - `resources/island/prerender.ts`: React prerender per island kind
  - `resources/island/bootstrap.ts`: page bootstrap with static imports
  - `resources/buildAsset/processor.ts`: script / css output mapping
  - `esbuildPlugin/llynRuntimePlugin.ts`: replaces `llyn/runtime` with generated
    code
  - `esbuildPlugin/serverRenderer.ts`: prod `llyn/runtime` generation
  - `esbuildPlugin/virtualFilePlugin.ts`: serves in-memory virtual files
  - `esbuildPlugin/dataUrlPlugin.ts`: keeps `data:` imports external
- `runtime/`
  - `index.ts`: re-exports (one exported function per file)
  - `startDevBuild.ts`: dev build and `DevContext` creation
  - `serveIsland.ts`: dev server island rendering
  - `serveLiveReload.ts`: boot id over SSE
  - `devContext.ts`: `DevContext`
