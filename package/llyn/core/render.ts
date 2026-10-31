import * as fs from "@std/fs";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as parse5Dom from "parse5-dom";
import * as htmlnano from "htmlnano";

import { Context } from "./context.ts";
import { IslandInstance } from "./island.ts";
import { LoadedDocument } from "./load.ts";
import { CollectedDocument } from "./scan.ts";
import {
  bootstrapPaths,
  hasRuntimeIslands,
} from "./resources/island/bootstrap.ts";
import {
  prerenderClientIsland,
  prerenderServerIsland,
  prerenderStaticIsland,
} from "./resources/island/prerender.ts";
import { liveReloadScript } from "./resources/html/liveReload.ts";

function prerenderIsland(instance: IslandInstance): Promise<string> {
  switch (instance.kind) {
    case "client":
      return prerenderClientIsland(instance);
    case "server":
      return prerenderServerIsland(instance);
    case "static":
      return prerenderStaticIsland(instance);
    default:
      throw Error(
        `Unknown island kind: ${JSON.stringify(instance.kind satisfies never)}`,
      );
  }
}

async function minifyHtml(html: string): Promise<string> {
  const result = await htmlnano.process(
    html,
    {
      minifyCss: false,
      minifyJs: false,
      minifySvg: false,
      skipConfigLoading: true,
      skipInternalWarnings: true,
    },
    htmlnano.presets.safe,
  );
  return result.html;
}

export async function writeDocument(
  doc: LoadedDocument,
  ctx: Context,
): Promise<void> {
  let content = parse5.serialize(doc.document);
  if (!ctx.dev) {
    content = await minifyHtml(content);
  }

  await fs.ensureDir(path.dirname(doc.outPath));
  await Deno.writeTextFile(doc.outPath, content);
}

export async function renderDocument(
  doc: CollectedDocument,
  ctx: Context,
): Promise<void> {
  const prerenders = await Promise.all(
    doc.islands.map(async (island) => ({
      element: island.element,
      html: await prerenderIsland(island.instance),
    })),
  );

  for (const prerender of prerenders) {
    const fragment = parse5.parseFragment(prerender.html);
    parse5Dom.replaceNodeWith(prerender.element, ...fragment.childNodes);
  }
  for (const script of doc.scripts) {
    parse5Dom.setAttribute(script.element, "src", script.reference);
    parse5Dom.setAttribute(script.element, "type", "module");
  }
  for (const stylesheet of doc.stylesheets) {
    parse5Dom.setAttribute(stylesheet.element, "href", stylesheet.reference);
  }
  const htmlElement = parse5Dom.selectOne(doc.document, { tag: "html" });
  if (!htmlElement) {
    throw Error("html not found");
  }
  if (hasRuntimeIslands(doc)) {
    parse5Dom.appendNodesTo(
      htmlElement,
      ...parse5.parseFragment(
        `<script type="module" src="${bootstrapPaths(doc).src}"></script>`,
      ).childNodes,
    );
  }
  if (ctx.liveReload) {
    parse5Dom.appendNodesTo(
      htmlElement,
      ...parse5.parseFragment(liveReloadScript()).childNodes,
    );
  }

  await writeDocument(doc, ctx);
}
