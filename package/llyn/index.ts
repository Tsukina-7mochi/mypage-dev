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

function pathWithoutExt(pathname: string): string {
  const extname = path.extname(pathname);
  return pathname.slice(0, -extname.length);
}

export async function build(
  srcPath: string,
  distPath: string,
  entryPaths: string[],
  workerEntryPath: string,
) {
  const idp = new IdProvider();
  const bootstraps = new Map<string, string>();
  const allServerIslands: Island[] = [];

  const staticPath = path.join(distPath, "static");

  const entries = entryPaths.map((entryPath) => {
    const outPath = path.join(staticPath, path.relative(srcPath, entryPath));
    const bootstrapSrc = `./${pathWithoutExt(path.basename(entryPath))}-bootstrap.js`;
    const bootstrapOutPath = pathWithoutExt(path.basename(bootstrapSrc));
    return { path: entryPath, outPath, bootstrapSrc, bootstrapOutPath };
  });

  for (const entry of entries) {
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
    entryPoints: [workerEntryPath],
    outfile: path.join(distPath, "worker.js"),
    format: "esm",
    bundle: true,
    plugins: [llynRuntimePlugin({ islands: allServerIslands }), denoPlugin()],
  });

  esbuild.stop();

  console.log("build finished");
}
