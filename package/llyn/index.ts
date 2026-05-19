import * as v from "valibot";
import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";

import { IdProvider } from "./idProvider.ts";
import { virtualFilePlugin } from "./esbuildPlugin/virtualFilePlugin.ts";
import {
  BuildOptions,
  BuildOptionsSchema,
  Island,
  ParsedBuildOptions,
} from "./types.ts";
import { llynRuntimePlugin } from "./esbuildPlugin/llynRuntimePlugin.ts";
import { createContext } from "./processor.ts";

type SourceFile = {
  in: string;
  out: string;
};
type VirtualFile = {
  in: string;
  out: string;
  content: string;
};

async function runBuild(options: ParsedBuildOptions) {
  const staticDist = new URL("static/", options.dist);

  const sourceFiles: SourceFile[] = [];
  const virtualFiles: VirtualFile[] = [];
  const serverIslands: Island[] = [];

  const ctx = createContext({
    dev: options.dev,
    root: options.root,
    dist: options.dist,
    staticDist,
    idProvider: new IdProvider(),
    registerSourceFile(input, output) {
      sourceFiles.push({ in: input, out: output });
    },
    registerVirtualFile(input, output, content) {
      virtualFiles.push({ in: input, out: output, content });
    },
    registerServerIsland(island) {
      serverIslands.push(island);
    },
  });

  await Promise.all(options.entries.documents.map(async (entry) => {
    if (entry instanceof URL) {
      await ctx.process["html"](entry, ctx);
    } else if (entry.type === "html") {
      await ctx.process["html"](entry.path, ctx);
    } else if (entry.type === "markdown") {
      await ctx.process["markdown"](entry.path, entry.template, ctx);
    } else {
      throw Error(`Unknown entry type: ${JSON.stringify(entry)}`);
    }
  }));

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
    plugins: [llynRuntimePlugin({ islands: serverIslands }), denoPlugin()],
    minify: !options.dev,
    sourcemap: options.dev ? "inline" : "linked",
  });

  await Promise.all([
    clientContext.rebuild(),
    serverContext.rebuild(),
  ]);

  clientContext.dispose();
  serverContext.dispose();
  esbuild.stop();
}

export async function build(options: BuildOptions) {
  const parsedOptions = v.parse(BuildOptionsSchema, options);
  await runBuild(parsedOptions);
  console.log("build finished");
}
