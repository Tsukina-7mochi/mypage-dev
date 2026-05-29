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
