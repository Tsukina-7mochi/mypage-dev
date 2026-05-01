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

type BuildOptions = {
  entries: {
    documents: string[];
    worker: string;
  };
  root: string;
  outdir: string;
};

function pathWithoutExt(pathname: string): string {
  const extname = path.extname(pathname);
  return pathname.slice(0, -extname.length);
}

export async function build(options: BuildOptions) {
  const idp = new IdProvider();
  const bootstraps = new Map<string, string>();
  const allServerIslands: Island[] = [];

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
    const clientIslands = html.getClientIslands(document).map((island) => ({
      ...island,
      path: path.resolve(path.dirname(entry.path), island.path),
      id: `island-${idp.generate()}`,
    }));
    const serverIslands = html.getServerIslands(document).map((island) => ({
      ...island,
      path: path.resolve(path.dirname(entry.path), island.path),
      id: `island-${idp.generate()}`,
    }));

    for (const ild of clientIslands) {
      const prerender = await island.prerender(ild);
      html.replaceNodeWithHtml(ild.element, prerender);
    }
    for (const ild of serverIslands) {
      const prerender = await island.prerender(ild);
      html.replaceNodeWithHtml(ild.element, prerender);
      allServerIslands.push(ild);
    }
    html.addBootstrapScript(document, entry.bootstrapSrc);

    await fs.ensureDir(path.dirname(entry.outPath));
    await Deno.writeTextFile(entry.outPath, html.stringify(document));

    const bootstrap = await island.renderBootstrap(
      clientIslands,
      serverIslands,
    );
    bootstraps.set(entry.bootstrapOutPath, bootstrap);
  }

  await esbuild.build({
    entryPoints: [...bootstraps.entries()].map(([outPath, _]) => ({
      in: `__virtual_${path.basename(outPath)}.ts`,
      out: outPath,
    })),
    outdir: staticPath,
    platform: "browser",
    bundle: true,
    plugins: [
      denoPlugin(),
      virtualFilePlugin({
        files: Object.fromEntries(
          bootstraps
            .entries()
            .map(([outPath, content]) => [
              `__virtual_${path.basename(outPath)}.ts`,
              content,
            ]),
        ),
      }),
    ],
  });

  await esbuild.build({
    entryPoints: [{ in: options.entries.worker, out: "worker" }],
    outdir: options.outdir,
    format: "esm",
    bundle: true,
    plugins: [llynRuntimePlugin({ islands: allServerIslands }), denoPlugin()],
  });

  esbuild.stop();

  console.log("build finished");
}
