import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";

import { virtualFilePlugin } from "./esbuildPlugin/virtualFilePlugin.ts";
import { llynRuntimePlugin } from "./esbuildPlugin/llynRuntimePlugin.ts";
import { dataUrlPlugin } from "./esbuildPlugin/dataUrlPlugin.ts";
import { Context } from "./context.ts";
import { uniqueServerIslands } from "./island.ts";
import { collectDocuments } from "./collect.ts";
import { loadDocuments } from "./load.ts";
import { scanDocuments } from "./scan.ts";
import { renderDocument } from "./render.ts";
import { SourceFile, VirtualFile } from "./entryPoint.ts";
import { renderBootstraps } from "./resources/island/bootstrap.ts";
import { getStaticDist, ResolvedLlynConfig } from "./config.ts";
import { copyPublic } from "./copyPublic.ts";
import { renderServerRenderer } from "./serverRenderer.ts";

export type BuildOptions = {
  dev: boolean;
  liveReload: boolean;
};

function buildClient(
  sourceFiles: SourceFile[],
  virtualFiles: VirtualFile[],
  staticDist: URL,
  options: BuildOptions,
): Promise<unknown> {
  return esbuild.build({
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
}

function buildWorker(
  serverRenderer: string,
  config: ResolvedLlynConfig,
  options: BuildOptions,
): Promise<unknown> {
  return esbuild.build({
    entryPoints: [{ in: config.worker.pathname, out: "worker" }],
    outdir: config.dist.pathname,
    format: "esm",
    bundle: true,
    plugins: [
      llynRuntimePlugin({ contents: serverRenderer }),
      denoPlugin(),
    ],
    minify: !options.dev,
    sourcemap: options.dev ? "inline" : "linked",
  });
}

export async function runBuild(
  config: ResolvedLlynConfig,
  options: BuildOptions,
): Promise<void> {
  const staticDist = getStaticDist(config);

  const ctx: Context = {
    dev: options.dev,
    liveReload: options.liveReload,
    root: config.root,
    staticDist,
  };

  const documents = await scanDocuments(
    await loadDocuments(await collectDocuments(config), ctx),
    ctx,
  );
  const sourceFiles = documents.flatMap((doc) =>
    [...doc.scripts, ...doc.stylesheets].map((asset) => asset.sourceFile)
  );
  const serverIslandList = uniqueServerIslands(
    documents.flatMap((doc) => doc.islands.map((island) => island.instance)),
  );

  const documentRender = Promise.all(
    documents.map((doc) => renderDocument(doc, ctx)),
  );
  const clientBuild = renderBootstraps(documents).then((virtualFiles) =>
    buildClient(sourceFiles, virtualFiles, staticDist, options)
  );
  const serverBuild = renderServerRenderer(
    serverIslandList,
    options.liveReload ? crypto.randomUUID() : undefined,
  ).then((serverRenderer) => buildWorker(serverRenderer, config, options));

  await Promise.all([
    documentRender,
    clientBuild,
    serverBuild,
    copyPublic(config),
  ]);
  await esbuild.stop();
}
