import * as path from "@std/path";
import * as fs from "@std/fs";
import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";
import * as html from "./html/index.ts";
import * as island from "./island/index.ts";
import { IdProvider } from "./idProvider.ts";
import { virtualFilePlugin } from "./esbuildPlugin/virtualFilePlugin.ts";
import { Island } from "./types.ts";
import { llynRuntimePlugin } from "./esbuildPlugin/llynRuntimePlugin.ts";

export type BuildOptions = {
  entries: {
    documents: string[];
    worker: string;
  };
  root: string;
  outdir: string;
};

type SourceFile = {
  in: string;
  out: string;
};
type VirtualFile = {
  in: string;
  out: string;
  content: string;
};

function pathWithoutExt(pathname: string): string {
  const extname = path.extname(pathname);
  return pathname.slice(0, -extname.length);
}

export async function build(options: BuildOptions) {
  const idp = new IdProvider();
  const sourceFiles: SourceFile[] = [];
  const virtualFiles: VirtualFile[] = [];
  const serverIslands: Island[] = [];

  const staticPath = path.join(options.outdir, "static");

  const documents = options.entries.documents.map((filename) => {
    const outPath = path.join(
      staticPath,
      path.relative(options.root, filename),
    );
    const bootstrapSrc = `./${pathWithoutExt(path.basename(filename))}-bootstrap.js`;
    const bootstrapOutPath = pathWithoutExt(path.basename(bootstrapSrc));
    return { path: filename, outPath, bootstrapSrc, bootstrapOutPath };
  });

  for (const entry of documents) {
    const document = await html.parse(entry.path);
    const resources_ = html.getResourceReferences(document);
    const resources = {
      ...resources_,
      clientIslands: resources_.clientIslands.map((island) => ({
        ...island,
        path: path.resolve(path.dirname(entry.path), island.path),
        id: `island-${idp.generate()}`,
      })),
      serverIslands: resources_.serverIslands.map((island) => ({
        ...island,
        path: path.resolve(path.dirname(entry.path), island.path),
        id: `island-${idp.generate()}`,
      })),
    };

    for (const ild of resources.clientIslands) {
      const prerender = await island.prerender(ild);
      html.replaceNodeWithHtml(ild.element, prerender);
    }
    for (const ild of resources.serverIslands) {
      const prerender = await island.prerender(ild);
      html.replaceNodeWithHtml(ild.element, prerender);
      serverIslands.push(ild);
    }
    html.addBootstrapScript(document, entry.bootstrapSrc);

    await fs.ensureDir(path.dirname(entry.outPath));
    await Deno.writeTextFile(entry.outPath, html.stringify(document));

    const bootstrap = await island.renderBootstrap(
      resources.clientIslands,
      resources.serverIslands,
    );
    virtualFiles.push({
      in: `__virtual_${path.basename(entry.bootstrapOutPath)}.ts`,
      out: entry.bootstrapOutPath,
      content: bootstrap,
    });
  }

  await esbuild.build({
    entryPoints: [
      ...sourceFiles,
      ...virtualFiles.map(({ content: _, ...entry }) => entry),
    ],
    outdir: staticPath,
    platform: "browser",
    bundle: true,
    plugins: [
      denoPlugin(),
      virtualFilePlugin({
        files: Object.fromEntries(virtualFiles.map((f) => [f.in, f.content])),
      }),
    ],
  });

  await esbuild.build({
    entryPoints: [{ in: options.entries.worker, out: "worker" }],
    outdir: options.outdir,
    format: "esm",
    bundle: true,
    plugins: [llynRuntimePlugin({ islands: serverIslands }), denoPlugin()],
  });

  esbuild.stop();

  console.log("build finished");
}
