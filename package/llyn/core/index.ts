import * as v from "valibot";
import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";

import { virtualFilePlugin } from "../esbuildPlugin/virtualFilePlugin.ts";
import {
  BuildOptions,
  BuildOptionsSchema,
  Island,
  ParsedBuildOptions,
} from "./types.ts";
import { llynRuntimePlugin } from "../esbuildPlugin/llynRuntimePlugin.ts";
import { createContext } from "./processor.ts";
import { createIsland } from "./island.ts";
import { collectDocuments } from "./collect.ts";
import { ResolvedLlynConfig } from "./config.ts";

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
  worker: boolean;
};

async function runBuildWithOptions(
  options: ParsedBuildOptions,
  internalOptions: InternalBuildOptions,
): Promise<Island[]> {
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
      return createIsland(options.root, url);
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

  const serverIslandList = [...serverIslands.values()];
  const serverContext = internalOptions.worker
    ? await esbuild.context({
      entryPoints: [{ in: options.entries.worker.pathname, out: "worker" }],
      outdir: options.dist.pathname,
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

export async function runBuild(
  config: ResolvedLlynConfig,
  options: { dev: boolean; liveReload: boolean; worker: boolean },
): Promise<Island[]> {
  const documents = await collectDocuments(config);

  return await runBuildWithOptions({
    dev: options.dev,
    root: config.root,
    dist: config.dist,
    entries: {
      documents,
      worker: config.worker,
    },
  }, {
    liveReload: options.liveReload,
    worker: options.worker,
  });
}

export async function build(options: BuildOptions) {
  const parsedOptions = v.parse(BuildOptionsSchema, options);
  await runBuildWithOptions(parsedOptions, {
    liveReload: false,
    worker: true,
  });
  console.log("build finished");
}

export type { BuildOptions };
export * from "./collect.ts";
export * from "./config.ts";
export * from "./island.ts";
