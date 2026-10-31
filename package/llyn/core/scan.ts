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
import { buildAssetProcessor } from "./resources/buildAsset/processor.ts";

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

function scanAsset(
  element: Element,
  reference: string,
  entryUrl: URL,
  ctx: Context,
): ScannedAsset {
  const url = new URL(reference, entryUrl);
  const { outFile, sourceFile } = buildAssetProcessor(url, ctx);
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
