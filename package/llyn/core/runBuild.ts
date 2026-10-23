import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";

import { virtualFilePlugin } from "./esbuildPlugin/virtualFilePlugin.ts";
import { llynRuntimePlugin } from "./esbuildPlugin/llynRuntimePlugin.ts";
import { dataUrlPlugin } from "./esbuildPlugin/dataUrlPlugin.ts";
import { Context } from "./context.ts";
import { mergeDocumentOutputs } from "./documentOutput.ts";
import { processDocument } from "./resources/processor.ts";
import { Island, uniqueServerIslands } from "./island.ts";
import { collectDocuments } from "./collect.ts";
import { getStaticDist, ResolvedLlynConfig } from "./config.ts";
import { copyPublic } from "./copyPublic.ts";

export type BuildOptions = {
  dev: boolean;
  liveReload: boolean;
  worker: boolean;
};

export async function runBuild(
  config: ResolvedLlynConfig,
  options: BuildOptions,
): Promise<Island[]> {
  const staticDist = getStaticDist(config);

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
  const serverIslandList = uniqueServerIslands(islands);

  const clientBuild = esbuild.build({
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
      dataUrlPlugin(),
      denoPlugin(),
    ],
    minify: !options.dev,
    sourcemap: options.dev ? "inline" : "linked",
  });

  const serverBuild = options.worker
    ? esbuild.build({
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

  await Promise.all([clientBuild, serverBuild, copyPublic(config)]);
  await esbuild.stop();

  return serverIslandList;
}
