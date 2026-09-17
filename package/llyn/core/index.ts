import * as v from "valibot";
import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";
import * as path from "@std/path";

import { virtualFilePlugin } from "../esbuildPlugin/virtualFilePlugin.ts";
import {
  BuildOptions,
  BuildOptionsSchema,
  Island,
  ParsedBuildOptions,
  ServerOptions,
  ServerOptionSchema,
} from "./types.ts";
import { llynRuntimePlugin } from "../esbuildPlugin/llynRuntimePlugin.ts";
import { createContext } from "./processor.ts";
import { createIsland, createIslandResolver } from "./island.ts";
import { collectDocuments, collectIslandUrls } from "./collect.ts";
import { ResolvedLlynConfig } from "./config.ts";
import { DebounceLatestStream, watchFs } from "./util/stream.ts";

type SourceFile = {
  in: string;
  out: string;
};
type VirtualFile = {
  in: string;
  out: string;
  content: string;
};

type InternalBuildOptions = {
  liveReload: boolean;
  resolveIsland?: (url: URL) => Promise<Island>;
};

async function runBuildWithOptions(
  options: ParsedBuildOptions,
  internalOptions: InternalBuildOptions,
) {
  const staticDist = new URL("static/", options.dist);

  const sourceFiles: SourceFile[] = [];
  const virtualFiles: VirtualFile[] = [];
  const islands = new Map<string, Island>();
  const serverIslands = new Map<string, Island>();

  const ctx = createContext({
    dev: !!options.dev,
    liveReload: internalOptions.liveReload,
    root: options.root,
    dist: options.dist,
    staticDist,
    resolveIsland(url) {
      return internalOptions.resolveIsland?.(url) ??
        createIsland(options.root, url);
    },
    registerSourceFile(input, output) {
      sourceFiles.push({ in: input, out: output });
    },
    registerVirtualFile(input, output, content) {
      virtualFiles.push({ in: input, out: output, content });
    },
    registerIsland(island) {
      const registered = islands.get(island.id);
      if (registered && registered.specifier !== island.specifier) {
        throw new Error(
          `Island ID collision: ${registered.specifier} and ${island.specifier}`,
        );
      }
      islands.set(island.id, island);
    },
    registerServerIsland(island) {
      serverIslands.set(island.id, island);
    },
  });

  await Promise.all(
    options.entries.documents.map(async (entry) => {
      if (entry instanceof URL) {
        await ctx.process["html"](entry, ctx);
      } else if (entry.type === "html") {
        await ctx.process["html"](entry.path, ctx);
      } else if (entry.type === "markdown") {
        await ctx.process["markdown"](entry.path, entry.template, ctx);
      } else {
        throw Error(`Unknown entry type: ${JSON.stringify(entry)}`);
      }
    }),
  );

  const clientContext = await esbuild.context({
    entryPoints: [
      ...sourceFiles,
      ...virtualFiles.map(({ content: _, ...entry }) => entry),
    ],
    outdir: staticDist.pathname,
    platform: "browser",
    bundle: true,
    plugins: [
      virtualFilePlugin({
        files: Object.fromEntries(virtualFiles.map((f) => [f.in, f.content])),
      }),
      {
        name: "data-url",
        setup(build) {
          build.onResolve({ filter: /^data:/ }, (args) => {
            return { path: args.path, external: true };
          });
        },
      },
      denoPlugin(),
    ],
    minify: !options.dev,
    sourcemap: options.dev ? "inline" : "linked",
  });

  const serverContext = await esbuild.context({
    entryPoints: [{ in: options.entries.worker.pathname, out: "worker" }],
    outdir: options.dist.pathname,
    format: "esm",
    bundle: true,
    plugins: [
      llynRuntimePlugin({ islands: [...serverIslands.values()] }),
      denoPlugin(),
    ],
    minify: !options.dev,
    sourcemap: options.dev ? "inline" : "linked",
  });

  await Promise.all([clientContext.rebuild(), serverContext.rebuild()]);

  await clientContext.dispose();
  await serverContext.dispose();
  await esbuild.stop();
}

export async function runBuild(
  config: ResolvedLlynConfig,
  options: { dev: boolean; liveReload: boolean },
): Promise<void> {
  const [documents, islandUrls] = await Promise.all([
    collectDocuments(config),
    collectIslandUrls(config),
  ]);
  const islands = await Promise.all(
    islandUrls.map((url) => createIsland(config.root, url)),
  );

  await runBuildWithOptions({
    dev: options.dev,
    root: config.root,
    dist: config.dist,
    entries: {
      documents,
      worker: config.worker,
    },
  }, {
    liveReload: options.liveReload,
    resolveIsland: createIslandResolver(islands),
  });
}

export async function build(options: BuildOptions) {
  const parsedOptions = v.parse(BuildOptionsSchema, options);
  await runBuildWithOptions(parsedOptions, {
    liveReload: false,
  });
  console.log("build finished");
}

export async function startDevServer(
  options: BuildOptions,
  serverOptions?: ServerOptions,
) {
  const parsedOptions = v.parse(BuildOptionsSchema, options);
  await startBuildServer(
    parsedOptions.root,
    parsedOptions.dist,
    () => runBuildWithOptions(parsedOptions, { liveReload: true }),
    serverOptions,
  );
}

export async function startBuildServer(
  root: URL,
  dist: URL,
  build: () => Promise<void>,
  serverOptions?: ServerOptions,
) {
  const { host: hostname, port } = v.parse(
    ServerOptionSchema,
    serverOptions ?? {},
  );

  let server: Deno.HttpServer | null = null;
  let reloadStreamWriters: WritableStreamDefaultWriter[] = [];
  let ac = new AbortController();

  (async () => {
    const fsStream = watchFs(root.pathname, {
      recursive: true,
    }).pipeThrough(new DebounceLatestStream(500));

    for await (const _ of fsStream) {
      ac.abort();
    }
  })().catch((e) => {
    console.error(e);
  });

  while (true) {
    ac = new AbortController();

    try {
      await build();
      console.log("build finished");
    } catch (err) {
      console.error("build ended wihth error\n", err);
    }

    if (ac.signal.aborted) continue;

    await Promise.all(
      reloadStreamWriters.map(async (writer) => {
        try {
          const event = "event: reload\ndata: {}\n\n";
          const payload = new TextEncoder().encode(event);
          await writer.write(payload);
          await writer.close();
        } catch {
          // already closed
        }
      }),
    );
    reloadStreamWriters = [];

    await server?.shutdown();

    const moduleName = path.join(
      dist.pathname,
      `worker.js?${Date.now()}`,
    );
    server = Deno.serve({ hostname, port }, async (req: Request) => {
      if (new URL(req.url).pathname === "/__reload") {
        const { readable, writable } = new TransformStream<string>();
        const writer = writable.getWriter();
        reloadStreamWriters.push(writer);

        req.signal.addEventListener("close", () => {
          writer.close().catch(() => {
            /* already closed */
          });
        });

        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
      return (await import(moduleName)).default.fetch(req);
    });

    await new Promise((resolve) => {
      ac.signal.addEventListener("abort", resolve);
    });
  }
}

export type { BuildOptions };
export * from "./collect.ts";
export * from "./config.ts";
export * from "./island.ts";
