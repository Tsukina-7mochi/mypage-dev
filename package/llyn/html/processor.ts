import * as fs from "@std/fs";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as parse5Dom from "parse5-dom";

import {
  HtmlDocumentFragmentProcessor,
  HtmlDocumentProcessor,
  HtmlFileProcessor,
  ProcessContext,
} from "../types.ts";
import {
  getClientIslands,
  getScripts,
  getServerIslands,
  getStylesheets,
} from "./helper.ts";
import {
  clientIslandProcessor,
  serverIslandProcessor,
} from "../island/processor.ts";
import { buildAssetProcessor } from "../buildAsset/processor.ts";
import { renderBootstrap } from "../island/bootstrap.ts";
import { decomposeExtension } from "../util/path.ts";

type Document = parse5.DefaultTreeAdapterTypes.Document;
type DocumentFragment = parse5.DefaultTreeAdapterTypes.DocumentFragment;

async function processDocument<T extends Document | DocumentFragment>(
  entryUrl: URL,
  document: T,
  ctx: ProcessContext,
): Promise<T> {
  const entryPath = entryUrl.pathname;
  const rootPath = ctx.options.root.pathname;
  const staticDistPath = ctx.options.staticDist.pathname;
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

      const { prerender } = await clientIslandProcessor.process(
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

      const { prerender } = await serverIslandProcessor.process(
        island,
        ctx,
      );
      ctx.registerServerIsland(island);
      return { island, element: el.element, prerender };
    }),
  );

  const scripts = getScripts(document).map((el) => {
    const url = new URL(el.path, entryUrl);
    const { outFile } = buildAssetProcessor.process(url, ctx);
    const newSrc = path.relative(entryOutPath, outFile.pathname);
    return { element: el.element, newSrc };
  });

  const stylesheets = getStylesheets(document).map((el) => {
    const url = new URL(el.path, entryUrl);
    const { outFile } = buildAssetProcessor.process(url, ctx);
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

export const htmlDocumentFragmentProcessor = {
  type: "html-document-fragment",
  async process(
    { url, content }: { url: URL; content: string },
    ctx: ProcessContext,
  ): Promise<{ documentFragment: DocumentFragment }> {
    const documentFragment = parse5.parseFragment(content);
    return {
      documentFragment: await processDocument(url, documentFragment, ctx),
    };
  },
} satisfies HtmlDocumentFragmentProcessor;

export const htmlDocumentProcessor = {
  type: "html-document",
  async process(
    { url, content }: { url: URL; content: string },
    ctx: ProcessContext,
  ): Promise<{ document: Document }> {
    const document = parse5.parse(content);
    return {
      document: await processDocument(url, document, ctx),
    };
  },
} satisfies HtmlDocumentProcessor;

export const htmlFileProcessor = {
  type: "html",
  async process(url: URL, ctx: ProcessContext): Promise<void> {
    const filepath = url.pathname;
    const rootPath = ctx.options.root.pathname;
    const staticDistPath = ctx.options.staticDist.pathname;
    const outPath = path.join(
      staticDistPath,
      path.relative(rootPath, filepath),
    );

    const rawContent = await Deno.readTextFile(url);
    const { document } = await htmlDocumentProcessor.process(
      { url, content: rawContent },
      ctx,
    );
    const content = parse5.serialize(document);

    await fs.ensureDir(path.dirname(outPath));
    await Deno.writeTextFile(outPath, content);
  },
} satisfies HtmlFileProcessor;
