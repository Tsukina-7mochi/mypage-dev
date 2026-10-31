import * as fs from "@std/fs";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as parse5Dom from "parse5-dom";
import * as htmlnano from "htmlnano";

import { Context } from "./context.ts";
import { VirtualFile } from "./entryPoint.ts";
import { IslandInstance } from "./island.ts";
import { LoadedDocument } from "./load.ts";
import { CollectedDocument } from "./scan.ts";
import { renderBootstrap } from "./resources/island/bootstrap.ts";
import {
  prerenderClientIsland,
  prerenderServerIsland,
  prerenderStaticIsland,
} from "./resources/island/prerender.ts";
import { liveReloadScript } from "./resources/html/liveReload.ts";
import { decomposeExtension } from "./util/path.ts";

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
): Promise<VirtualFile[]> {
  const entryPath = doc.url.pathname;
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
  const instances = doc.islands.map((island) => island.instance);
  const clientIslands = instances.filter((i) => i.kind === "client");
  const serverIslands = instances.filter((i) => i.kind === "server");
  const hasRuntimeIslands = clientIslands.length > 0 ||
    serverIslands.length > 0;
  if (hasRuntimeIslands) {
    parse5Dom.appendNodesTo(
      htmlElement,
      ...parse5.parseFragment(
        `<script type="module" src="${bootstrapSrc}"></script>`,
      ).childNodes,
    );
  }
  if (ctx.liveReload) {
    parse5Dom.appendNodesTo(
      htmlElement,
      ...parse5.parseFragment(liveReloadScript()).childNodes,
    );
  }

  const virtualFiles = hasRuntimeIslands
    ? [{
      in: `${entryPath}.bootstrap.ts`,
      out: bootstrapOutName,
      content: await renderBootstrap(clientIslands, serverIslands),
    }]
    : [];

  await writeDocument(doc, ctx);

  return virtualFiles;
}
