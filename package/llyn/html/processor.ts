import * as fs from "@std/fs";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as parse5Dom from "parse5-dom";

import { Context as ProcessorContext } from "../processor.ts";
import {
  getClientIslands,
  getScripts,
  getServerIslands,
  getStylesheets,
} from "./helper.ts";
import { renderBootstrap } from "../island/bootstrap.ts";
import { decomposeExtension } from "../util/path.ts";

type Document = parse5.DefaultTreeAdapterTypes.Document;
type DocumentFragment = parse5.DefaultTreeAdapterTypes.DocumentFragment;

async function processDocument<T extends Document | DocumentFragment>(
  entryUrl: URL,
  document: T,
  ctx: ProcessorContext,
): Promise<T> {
  const entryPath = entryUrl.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const entryOutPath = path.join(
    staticDistPath,
    path.relative(rootPath, entryPath),
  );
  const [entryOutName, _] = decomposeExtension(entryOutPath);
  const bootstrapOutName = entryOutName + "-bootstrap";
  const bootstrapOutPath = bootstrapOutName + ".js";
  const bootstrapSrc = path.relative(
    path.dirname(entryOutPath),
    bootstrapOutPath,
  );

  const clientIslands = await Promise.all(
    getClientIslands(document).map(async (el) => {
      const id = ctx.idProvider.generate();
      const url = new URL(el.src, entryUrl);
      const island = { id, url, props: el.props };

      const { prerender } = await ctx.process["client-island"](
        island,
        ctx,
      );
      return { island, element: el.element, prerender };
    }),
  );

  const serverIslands = await Promise.all(
    getServerIslands(document).map(async (el) => {
      const id = ctx.idProvider.generate();
      const url = new URL(el.src, entryUrl);
      const island = { id, url, props: el.props };

      const { prerender } = await ctx.process["server-island"](
        island,
        ctx,
      );
      ctx.registerServerIsland(island);
      return { island, element: el.element, prerender };
    }),
  );

  const scripts = getScripts(document).map((el) => {
    const url = new URL(el.path, entryUrl);
    const { outFile } = ctx.process["build-asset"](url, ctx);
    const newSrc = path.relative(entryOutPath, outFile.pathname);
    return { element: el.element, newSrc };
  });

  const stylesheets = getStylesheets(document).map((el) => {
    const url = new URL(el.path, entryUrl);
    const { outFile } = ctx.process["build-asset"](url, ctx);
    const newHref = path.relative(entryOutPath, outFile.pathname);
    return { element: el.element, newHref };
  });

  for (const island of clientIslands) {
    const fragment = parse5.parseFragment(island.prerender);
    parse5Dom.replaceNodeWith(island.element, ...fragment.childNodes);
  }
  for (const island of serverIslands) {
    const fragment = parse5.parseFragment(island.prerender);
    parse5Dom.replaceNodeWith(island.element, ...fragment.childNodes);
  }
  for (const script of scripts) {
    parse5Dom.setAttribute(script.element, "src", script.newSrc);
  }
  for (const stylesheet of stylesheets) {
    parse5Dom.setAttribute(stylesheet.element, "href", stylesheet.newHref);
  }
  parse5Dom.appendNodesTo(
    document,
    ...parse5.parseFragment(`<script src="${bootstrapSrc}"></script>`)
      .childNodes,
  );

  const bootstrapScript = await renderBootstrap(
    clientIslands.map((i) => i.island),
    serverIslands.map((i) => i.island),
  );
  ctx.registerVirtualFile(
    `${entryPath}.bootstrap.ts`,
    bootstrapOutName,
    bootstrapScript,
  );

  return document;
}

export async function htmlDocumentFragmentProcessor(
  file: URL,
  content: string,
  ctx: ProcessorContext,
): Promise<DocumentFragment> {
  const documentFragment = parse5.parseFragment(content);
  return await processDocument(file, documentFragment, ctx);
}

export async function htmlDocumentProcessor(
  file: URL,
  content: string,
  ctx: ProcessorContext,
): Promise<Document> {
  const document = parse5.parse(content);
  return await processDocument(file, document, ctx);
}

export async function htmlFileProcessor(
  url: URL,
  ctx: ProcessorContext,
): Promise<void> {
  const filepath = url.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const outPath = path.join(
    staticDistPath,
    path.relative(rootPath, filepath),
  );

  const rawContent = await Deno.readTextFile(url);
  const document = await ctx.process["html-document"](url, rawContent, ctx);
  const content = parse5.serialize(document);

  await fs.ensureDir(path.dirname(outPath));
  await Deno.writeTextFile(outPath, content);
}
