import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";

import { virtualFilePlugin } from "../esbuildPlugin/virtualFilePlugin.ts";
import { DocumentEntry, Island } from "./types.ts";
import { llynRuntimePlugin } from "../esbuildPlugin/llynRuntimePlugin.ts";
import { Context, DocumentOutput, mergeDocumentOutputs } from "./context.ts";
import { htmlFileProcessor } from "./resources/html/processor.ts";
import { markdownProcessor } from "./resources/markdown/processor.ts";
import { uniqueIslands } from "./island.ts";
import { collectDocuments } from "./collect.ts";
import { ResolvedLlynConfig } from "./config.ts";

export type BuildOptions = {
  dev: boolean;
  liveReload: boolean;
  worker: boolean;
};

function processDocument(
  entry: DocumentEntry,
  ctx: Context,
): Promise<DocumentOutput> {
  switch (entry.type) {
    case "html":
      return htmlFileProcessor(entry.path, ctx);
    case "markdown":
      return markdownProcessor(entry.path, ctx);
    default:
      throw Error(
        `Unknown entry type: ${JSON.stringify(entry satisfies never)}`,
      );
  }
}

export async function runBuild(
  config: ResolvedLlynConfig,
  options: BuildOptions,
): Promise<Island[]> {
  const staticDist = new URL("static/", config.dist);

  const ctx: Context = {
    dev: options.dev,
    liveReload: options.liveReload,
    root: config.root,
    staticDist,
  };

  const { sourceFiles, virtualFiles, islands } = mergeDocumentOutputs(
    await Promise.all(
      (await collectDocuments(config)).map((entry) =>
        processDocument(entry, ctx)
      ),
    ),
  );
  const allIslands = uniqueIslands(islands.map((instance) => instance.island));
  const serverIslandIds = new Set(
    islands
      .filter((instance) => instance.kind === "server")
      .map((instance) => instance.island.id),
  );
  const serverIslandList = allIslands.filter((island) =>
    serverIslandIds.has(island.id)
  );

  const clientContext = await esbuild.context({
    entryPoints: [
      ...sourceFiles,
      ...virtualFiles.map(({ content: _, ...entry }) => entry),
    ],
    outdir: staticDist.pathname,
    platform: "browser",
    format: "esm",
    bundle: true,
    splitting: true,
    chunkNames: "chunks/[name]-[hash]",
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

  const serverContext = options.worker
    ? await esbuild.context({
      entryPoints: [{ in: config.worker.pathname, out: "worker" }],
      outdir: config.dist.pathname,
      format: "esm",
      bundle: true,
      plugins: [
        llynRuntimePlugin({ islands: serverIslandList }),
        denoPlugin(),
      ],
      minify: !options.dev,
      sourcemap: options.dev ? "inline" : "linked",
    })
    : undefined;

  await Promise.all([clientContext.rebuild(), serverContext?.rebuild()]);

  await clientContext.dispose();
  await serverContext?.dispose();
  await esbuild.stop();

  return serverIslandList;
}

export * from "./collect.ts";
export * from "./config.ts";
export * from "./island.ts";
