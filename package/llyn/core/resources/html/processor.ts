import * as fs from "@std/fs";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as parse5Dom from "parse5-dom";
import * as htmlnano from "htmlnano";

import { Context } from "../../context.ts";
import { DocumentOutput } from "../../documentOutput.ts";
import { createIsland, IslandInstance, IslandKind } from "../../island.ts";
import {
  getClientIslands,
  getScripts,
  getServerIslands,
  getStaticIslands,
  getStylesheets,
} from "./helper.ts";
import { renderBootstrap } from "../island/bootstrap.ts";
import {
  prerenderClientIsland,
  prerenderServerIsland,
  prerenderStaticIsland,
} from "../island/prerender.ts";
import { buildAssetProcessor } from "../buildAsset/processor.ts";
import { decomposeExtension } from "../../util/path.ts";
import { liveReloadScript } from "./liveReload.ts";

type ParentNode = parse5.DefaultTreeAdapterTypes.ParentNode;
type Element = parse5.DefaultTreeAdapterTypes.Element;

async function createIslandInstance(
  src: string,
  props: Record<string, string>,
  kind: IslandKind,
  index: number,
  baseUrl: URL,
  ctx: Context,
): Promise<IslandInstance> {
  const island = await createIsland(ctx.root, new URL(src, baseUrl));
  return {
    island,
    kind,
    domId: `${island.id}-${index}`,
    props,
  };
}

export async function htmlNodeProcessor<T extends ParentNode>(
  entryUrl: URL,
  document: T,
  ctx: Context,
  baseUrlOf: (element: Element) => URL = () => entryUrl,
): Promise<DocumentOutput> {
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
  let islandIndex = 0;

  const clientIslands = await Promise.all(
    getClientIslands(document).map(async (el) => {
      const instance = await createIslandInstance(
        el.src,
        el.props,
        "client",
        islandIndex++,
        baseUrlOf(el.element),
        ctx,
      );
      const prerender = await prerenderClientIsland(instance);
      return { instance, element: el.element, prerender };
    }),
  );

  const serverIslands = await Promise.all(
    getServerIslands(document).map(async (el) => {
      const instance = await createIslandInstance(
        el.src,
        el.props,
        "server",
        islandIndex++,
        baseUrlOf(el.element),
        ctx,
      );
      const prerender = await prerenderServerIsland(instance);
      return { instance, element: el.element, prerender };
    }),
  );

  const staticIslands = await Promise.all(
    getStaticIslands(document).map(async (el) => {
      const instance = await createIslandInstance(
        el.src,
        el.props,
        "static",
        islandIndex++,
        baseUrlOf(el.element),
        ctx,
      );
      const prerender = await prerenderStaticIsland(instance);
      return { instance, element: el.element, prerender };
    }),
  );

  const scripts = getScripts(document).map((el) => {
    const url = new URL(el.path, baseUrlOf(el.element));
    const { outFile, sourceFile } = buildAssetProcessor(url, ctx);
    const newSrc = "/" + path.relative(staticDistPath, outFile.pathname);
    return { element: el.element, newSrc, sourceFile };
  });

  const stylesheets = getStylesheets(document).map((el) => {
    const url = new URL(el.path, baseUrlOf(el.element));
    const { outFile, sourceFile } = buildAssetProcessor(url, ctx);
    const newHref = "/" + path.relative(staticDistPath, outFile.pathname);
    return { element: el.element, newHref, sourceFile };
  });

  for (const island of clientIslands) {
    const fragment = parse5.parseFragment(island.prerender);
    parse5Dom.replaceNodeWith(island.element, ...fragment.childNodes);
  }
  for (const island of serverIslands) {
    const fragment = parse5.parseFragment(island.prerender);
    parse5Dom.replaceNodeWith(island.element, ...fragment.childNodes);
  }
  for (const island of staticIslands) {
    const fragment = parse5.parseFragment(island.prerender);
    parse5Dom.replaceNodeWith(island.element, ...fragment.childNodes);
  }
  for (const script of scripts) {
    parse5Dom.setAttribute(script.element, "src", script.newSrc);
    parse5Dom.setAttribute(script.element, "type", "module");
  }
  for (const stylesheet of stylesheets) {
    parse5Dom.setAttribute(stylesheet.element, "href", stylesheet.newHref);
  }
  const hasRuntimeIslands = clientIslands.length > 0 ||
    serverIslands.length > 0;
  if (hasRuntimeIslands) {
    parse5Dom.appendNodesTo(
      parse5Dom.selectOne(document, { tag: "html" }) ?? document,
      ...parse5.parseFragment(
        `<script type="module" src="${bootstrapSrc}"></script>`,
      ).childNodes,
    );
  }
  // Fragments have no html element and rely on their enclosing document.
  const htmlElement = parse5Dom.selectOne(document, { tag: "html" });
  if (ctx.liveReload && htmlElement) {
    parse5Dom.appendNodesTo(
      htmlElement,
      ...parse5.parseFragment(liveReloadScript()).childNodes,
    );
  }

  const virtualFiles = hasRuntimeIslands
    ? [{
      in: `${entryPath}.bootstrap.ts`,
      out: bootstrapOutName,
      content: await renderBootstrap(
        clientIslands.map((i) => i.instance),
        serverIslands.map((i) => i.instance),
      ),
    }]
    : [];

  return {
    sourceFiles: [...scripts, ...stylesheets].map((asset) => asset.sourceFile),
    virtualFiles,
    islands: [...clientIslands, ...serverIslands, ...staticIslands].map(
      (island) => island.instance,
    ),
  };
}

export async function minifyHtml(html: string): Promise<string> {
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

export async function htmlFileProcessor(
  url: URL,
  ctx: Context,
): Promise<DocumentOutput> {
  const filepath = url.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const outPath = path.join(staticDistPath, path.relative(rootPath, filepath));

  const rawContent = await Deno.readTextFile(url);
  const document = parse5.parse(rawContent);
  const output = await htmlNodeProcessor(url, document, ctx);
  let content = parse5.serialize(document);

  if (!ctx.dev) {
    content = await minifyHtml(content);
  }

  await fs.ensureDir(path.dirname(outPath));
  await Deno.writeTextFile(outPath, content);

  return output;
}
