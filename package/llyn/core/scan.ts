import * as parse5 from "parse5";
import * as path from "@std/path";

import { Context } from "./context.ts";
import { createIsland, IslandInstance, IslandKind } from "./island.ts";
import { CollectedDocument, LoadedDocument, ScannedAsset } from "./document.ts";
import {
  getClientIslands,
  getScripts,
  getServerIslands,
  getStaticIslands,
  getStylesheets,
} from "./dom.ts";
import { SourceFile } from "./entryPoint.ts";
import { decomposeExtension } from "./util/path.ts";

type Element = parse5.DefaultTreeAdapterTypes.Element;

async function createIslandInstance(
  src: string,
  props: Record<string, string>,
  kind: IslandKind,
  index: number,
  entryUrl: URL,
  ctx: Context,
): Promise<IslandInstance> {
  const island = await createIsland(ctx.root, new URL(src, entryUrl));
  return {
    island,
    kind,
    domId: `${island.id}-${index}`,
    props,
  };
}

const extensionConversion = {
  ".ts": ".js",
  ".jsx": ".js",
  ".tsx": ".js",
  ".mjs": ".js",
  ".cjs": ".js",
};

function resolveAssetOutput(
  url: URL,
  ctx: Context,
): { outFile: URL; sourceFile: SourceFile } {
  const filepath = url.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const outPathPreExt = path.join(
    staticDistPath,
    path.relative(rootPath, filepath),
  );

  let outPath = outPathPreExt;
  const [outName, outExt] = decomposeExtension(outPathPreExt);
  if (outExt in extensionConversion) {
    outPath = outName +
      extensionConversion[outExt as keyof typeof extensionConversion];
  }

  return {
    outFile: new URL(`file://${outPath}`),
    sourceFile: { in: filepath, out: outName },
  };
}

function scanAsset(
  element: Element,
  reference: string,
  entryUrl: URL,
  ctx: Context,
): ScannedAsset {
  const url = new URL(reference, entryUrl);
  const { outFile, sourceFile } = resolveAssetOutput(url, ctx);
  return {
    element,
    reference: "/" + path.relative(ctx.staticDist.pathname, outFile.pathname),
    sourceFile,
  };
}

async function scanDocument(
  doc: LoadedDocument,
  ctx: Context,
): Promise<CollectedDocument> {
  const islandElements = [
    ...getClientIslands(doc.document).map((el) => ({
      el,
      kind: "client" as const,
    })),
    ...getServerIslands(doc.document).map((el) => ({
      el,
      kind: "server" as const,
    })),
    ...getStaticIslands(doc.document).map((el) => ({
      el,
      kind: "static" as const,
    })),
  ];

  const islands = await Promise.all(
    islandElements.map(async ({ el, kind }, index) => ({
      instance: await createIslandInstance(
        el.src,
        el.props,
        kind,
        index,
        doc.url,
        ctx,
      ),
      element: el.element,
    })),
  );

  const scripts = getScripts(doc.document).map((el) =>
    scanAsset(el.element, el.path, doc.url, ctx)
  );
  const stylesheets = getStylesheets(doc.document).map((el) =>
    scanAsset(el.element, el.path, doc.url, ctx)
  );

  return { ...doc, islands, scripts, stylesheets };
}

export function scanDocuments(
  docs: LoadedDocument[],
  ctx: Context,
): Promise<CollectedDocument[]> {
  return Promise.all(docs.map((doc) => scanDocument(doc, ctx)));
}
