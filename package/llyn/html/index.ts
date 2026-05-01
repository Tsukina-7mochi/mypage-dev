import * as parse5 from "parse5";
import { selectAll, selectOne } from "./selector.ts";

type ChildNode = parse5.DefaultTreeAdapterTypes.ChildNode;
type Element = parse5.DefaultTreeAdapterTypes.Element;
export type Document = parse5.DefaultTreeAdapterTypes.Document;

type IslandElement = {
  path: string;
  props: Record<string, string>;
  element: Element;
};

type ElementWithPath = {
  path: string;
  element: Element;
};

type ResourceReferences = {
  clientIslands: IslandElement[];
  serverIslands: IslandElement[];
  scripts: ElementWithPath[];
  css: ElementWithPath[];
};

function getIslandFromElement(element: Element): IslandElement {
  const attrs = Object.fromEntries(
    element.attrs.map((attr) => [attr.name, attr.value]),
  );
  const { src, type: __, ...props } = attrs;
  return { path: src, props, element };
}

export function getAttribute(element: Element, name: string): string | null {
  return element.attrs.find((attr) => attr.name === name)?.value ?? null;
}

export function setAttribute(element: Element, name: string, value: string) {
  const attr = element.attrs.find((attr) => attr.name === name);
  if (attr !== undefined) {
    attr.value = value;
  } else {
    element.attrs.push({ name, value });
  }
}

export async function parse(filepath: string): Promise<Document> {
  const content = await Deno.readTextFile(filepath);
  return parse5.parse(content);
}

export function getResourceReferences(document: Document): ResourceReferences {
  const clientIslands = selectAll(document, {
    tag: "script",
    attributes: { type: "application/client-island" },
  }).map(getIslandFromElement);
  const serverIslands = selectAll(document, {
    tag: "script",
    attributes: { type: "application/server-island" },
  }).map(getIslandFromElement);
  const scripts = selectAll(document, {
    tag: "script",
  })
    .filter((element) => getAttribute(element, "type") !== "text/javascript")
    .map((element) => ({ element, path: getAttribute(element, "src") ?? "" }));
  const css = selectAll(document, {
    tag: "link",
    attributes: { rel: "stylesheet" },
  }).map((element) => ({ element, path: getAttribute(element, "href") ?? "" }));

  return {
    clientIslands,
    serverIslands,
    scripts,
    css,
  };
}

export function replaceNodeWithHtml(element: ChildNode, html: string) {
  const nodes = parse5.parseFragment(html).childNodes;
  for (const node of nodes) {
    node.parentNode = element.parentNode;
  }

  if (!element.parentNode) {
    throw Error("The element has no parent node");
  }
  const index = element.parentNode.childNodes.indexOf(element);
  element.parentNode.childNodes.splice(index, 1, ...nodes);
}

export function addBootstrapScript(document: Document, src: string) {
  const body = selectOne(document, { tag: "body" });
  if (!body) {
    throw Error("body not found");
  }
  body.childNodes.push(
    parse5.parseFragment(`<script defer src="${src}"></script>`).childNodes[0],
  );
}

export function stringify(document: Document): string {
  return parse5.serialize(document);
}
