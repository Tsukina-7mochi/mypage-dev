import * as parse5 from "parse5";
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
import * as markdown from "./markdown/index.ts";

export type BuildOptions = {
  entries: {
    documents: string[];
    worker: string;
  };
  root: string;
  outdir: string;
  markdownTemplate: string;
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

type Document = parse5.DefaultTreeAdapterTypes.Document;

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
      pathWithoutExt(path.relative(options.root, filename)) + ".html",
    );
    const bootstrapName = `${pathWithoutExt(path.basename(filename))}-bootstrap`;
    const bootstrapSrc = bootstrapName + ".js";
    const bootstrapOutPath = path.relative(
      staticPath,
      path.join(path.dirname(outPath), bootstrapName),
    );
    return { path: filename, outPath, bootstrapSrc, bootstrapOutPath };
  });

  for (const entry of documents) {
    let document: Document;
    if (entry.path.endsWith(".md")) {
      document = await markdown.render(entry.path, options.markdownTemplate);
    } else {
      document = await html.parse(entry.path);
    }

    // WANTFIX: path is resolved based of markdown entry path
    // resources referenced in template won't be resolved correctly

    const resources_ = html.getResourceReferences(document);
    const resources = {
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
      scripts: resources_.scripts.map((script) => ({
        ...script,
        path: path.resolve(path.dirname(entry.path), script.path),
      })),
      styles: resources_.styles.map((style) => ({
        ...style,
        path: path.resolve(path.dirname(entry.path), style.path),
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

    const bootstrap = await island.renderBootstrap(
      resources.clientIslands,
      resources.serverIslands,
    );
    virtualFiles.push({
      in: `__virtual_${path.basename(entry.bootstrapOutPath)}.ts`,
      out: entry.bootstrapOutPath,
      content: bootstrap,
    });

    for (const script of resources.scripts) {
      const outName = pathWithoutExt(path.relative(options.root, script.path));
      const newSrc = path.relative(
        path.dirname(entry.outPath),
        path.join(staticPath, outName + ".js"),
      );
      html.replaceNodeWithHtml(
        script.element,
        `<script src="${newSrc}"></script>`,
      );
      sourceFiles.push({ in: script.path, out: outName });
    }

    for (const style of resources.styles) {
      const outName = pathWithoutExt(path.relative(options.root, style.path));
      const newPath = path.relative(
        path.dirname(entry.outPath),
        path.join(staticPath, outName + ".css"),
      );
      html.replaceNodeWithHtml(
        style.element,
        `<link rel="stylesheet" href="${newPath}">`,
      );
      sourceFiles.push({ in: style.path, out: outName });
    }

    await fs.ensureDir(path.dirname(entry.outPath));
    await Deno.writeTextFile(entry.outPath, html.stringify(document));
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
