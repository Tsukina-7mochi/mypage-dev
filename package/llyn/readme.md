# Llyn

Llyn is a website build framework based on island architecture. Llyn is designed
to minimize client code and response time. Additionally, Llyn is built on Deno
and configured to be deployed on Cloudflare Workers.

## Usage

Execute a build using `build(options)`. Start the development server using
`startDevServer(options, serverOptions)`. The development server provides
rebuilds upon change detection and live reloading. Please refer to `./types.ts`
for options.

### Documents

Llyn's entry points are documents, namely HTML and Markdown. Resources
referenced by documents are automatically included in the bundle. The list of
resources is as follows:

- client island: JavaScript/TypeScript/JSX/TSX files loaded via
  `<script type="application/client-island">`
- server island: JavaScript/TypeScript/JSX/TSX files loaded via
  `<script type="application/server-island">`
- scripts: JavaScript/TypeScript/JSX/TSX files loaded via `<script>` elements
  with a regular `type`
- css: CSS files loaded via `<link rel="stylesheet">`

### Worker

Another entry point for Llyn is the Web Worker. When the `llyn/runtime` module
is referenced from Worker code, dynamically generated code is embedded at build
time. The `renderIsland` function receives the server island ID and returns the
rendered HTML. The request path must be `/_island/${id}`.

### Islands

Llyn has multiple island types with different characteristics.

- client island: It is prerendered at build time, and the prelude is embedded
  instead of a `<script>` tag. At runtime, it is hydrated on the client using
  `hydrateRoot`.
- server island: It is rendered via `renderToStaticMarkup` at build time and
  embedded instead of a `<script>` tag. In the server runtime, it is rendered
  into an HTML string using `renderToReadableStream`. In the client runtime, it
  is fetched lazily after the page loads and replaced with the returned content.
  You can embed fallback content at build time by using `<Suspense>`.

> [!NOTE]
> Llyn does not have server-side rendering in the sense of React. Llyn's server
> islands are "lazy static islands." By combining Llyn's server islands, client
> islands, and static content, you can clearly separate the roles assumed by
> SSR.

## For Developers

This section is a minimal index for navigating the implementation when making
changes. It is not exhaustive; read the referenced files for details.

### Build flow

1. `build()` / `startDevServer()` (`index.ts`) parse options with valibot, then
   call `runBuild()`.
2. `runBuild()` creates a `Context` (`processor.ts`) holding shared state plus
   three registration callbacks: `registerSourceFile`, `registerVirtualFile`,
   and `registerServerIsland`. The `Context.process` map dispatches work to the
   per-resource processors.
3. Each document entry is processed: `html` and `markdown` documents flow
   through their processors, which walk the parse5 DOM and, as a side effect,
   register source files, virtual files, and server islands on the context.
4. Two esbuild contexts then run in parallel:
   - client: bundles registered source files and virtual files into
     `dist/static/` (browser platform).
   - server: bundles the worker entry into `dist/worker.js`, with
     `llynRuntimePlugin` replacing the `llyn/runtime` import with generated
     code.
5. Dev mode adds an FS watcher (debounced) that re-runs the build and pushes a
   reload event over SSE at `/__reload`; the worker is served via dynamic
   import.

### Resource processing

- HTML (`resources/html/processor.ts`): `htmlFileProcessor` reads, parses,
  delegates to `htmlNodeProcessor`, serializes, minifies (prod only), writes.
  `htmlNodeProcessor` is the core: it locates islands / scripts / stylesheets
  (`resources/html/helper.ts`), prerenders islands, rewrites the DOM, appends
  the bootstrap script, and registers a virtual bootstrap file.
- Markdown (`resources/markdown/processor.ts`): parses YAML frontmatter, renders
  the body with `marked`, runs both body and template through `html-node`, then
  injects the body into `<main>` and the title into `<head>`.
- Build assets (`resources/buildAsset/processor.ts`): maps script/CSS URLs to
  output paths, normalizes source extensions to `.js`, and registers them as
  esbuild source files.

### Islands

- `resources/island/prerender.ts`: imports the island module, builds a React
  element. Client islands use `prerender` and are wrapped in a `<div id>` for
  later hydration; server islands use `renderToStaticMarkup`.
- `resources/island/bootstrap.ts` (+ `bootstrapTemplate.ts`): emits the
  client-side script that hydrates client islands and lazily fetches server
  islands from `/_islands/:id`.
- `resources/island/serverRenderer.ts` (+ `serverRendererTemplate.ts`): emits
  the worker-side `renderIsland` registry that `llynRuntimePlugin` injects in
  place of `llyn/runtime`.

### Directory layout

- `index.ts`: build orchestration and dev server.
- `processor.ts`: `Context` type and the resource-type to processor map.
- `types.ts`: option schemas (valibot) and the `Island` type.
- `idProvider.ts`: island id generation.
- `resources/`: per-resource processors (the work units dispatched by Context).
- `esbuildPlugin/`: esbuild plugins for virtual files and the worker runtime.
- `runtime/`: the `llyn/runtime` module surface (build-time stub; real code is
  injected at build time).
- `util/`: path helpers and the FS-watch / debounce streams.

### Tree (key files)

```
- llyn/
  - index.ts                     build() / startDevServer() / runBuild()
  - processor.ts                 Context type + processor dispatch map
  - types.ts                     option schemas + Island type
  - idProvider.ts
  - esbuildPlugin/
    - llynRuntimePlugin.ts       injects server renderer for llyn/runtime
    - virtualFilePlugin.ts       serves in-memory virtual files
  - resources/
    - html/
      - processor.ts             htmlFileProcessor / htmlNodeProcessor (core)
      - helper.ts                DOM queries for islands/scripts/styles
      - liveReload.ts
    - markdown/
      - processor.ts             frontmatter + marked + template merge
    - island/
      - processor.ts             thin prerender wrappers
      - prerender.ts             React prerender (client) / static markup (server)
      - bootstrap.ts             client bootstrap script generation
      - serverRenderer.ts        worker renderIsland registry generation
    - buildAsset/
      - processor.ts             script/css output mapping
  - runtime/
    - index.ts                   re-exports renderIsland
    - renderIsland.ts            build-time stub
  - util/
    - path.ts                    extension / file-URL helpers
    - stream.ts                  watchFs + DebounceLatestStream
```
