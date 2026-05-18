import * as path from "@std/path";
import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";
import { IdProvider } from "./idProvider.ts";
import { virtualFilePlugin } from "./esbuildPlugin/virtualFilePlugin.ts";
import { BuildOptions, Island } from "./types.ts";
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

function toFileUrl(filePath: string) {
  return new URL(`file://${path.resolve(filePath)}`);
}

function toDirectoryFileUrl(filePath: string) {
  return new URL(`file://${path.resolve(filePath)}/`);
}

export async function build(options: BuildOptions) {
  const root = toDirectoryFileUrl(options.root);
  const dist = toDirectoryFileUrl(options.dist);
  const staticDist = new URL("static/", dist);
  const markdownTemplate = toFileUrl(options.markdownTemplate);

  const sourceFiles: SourceFile[] = [];
  const virtualFiles: VirtualFile[] = [];
  const serverIslands: Island[] = [];

  const ctx = createContext({
    dev: options.dev,
    root,
    dist,
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

  await Promise.all(options.entries.documents.map(async (filePath) => {
    const fileUrl = toFileUrl(filePath);
    if (fileUrl.pathname.endsWith(".html")) {
      await ctx.process["html"](fileUrl, ctx);
    } else if (fileUrl.pathname.endsWith(".md")) {
      await ctx.process["markdown"](fileUrl, markdownTemplate, ctx);
    } else {
      throw Error(`Unknown file type: ${fileUrl}`);
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
    entryPoints: [{ in: options.entries.worker, out: "worker" }],
    outdir: dist.pathname,
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

  console.log("build finished");
}
