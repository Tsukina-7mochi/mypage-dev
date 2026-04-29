import * as parse5 from "parse5";
import { selectAll, selectOne } from "./selector.ts";

type ChildNode = parse5.DefaultTreeAdapterTypes.ChildNode;
type Element = parse5.DefaultTreeAdapterTypes.Element;
type Document = parse5.DefaultTreeAdapterTypes.Document;

type Island = {
  path: string;
  props: Record<string, string>;
  element: Element;
};

export async function parse(filepath: string): Promise<Document> {
  const content = await Deno.readTextFile(filepath);
  return parse5.parse(content);
}

function getIslandFromElement(element: Element): Island {
  const attrs = Object.fromEntries(
    element.attrs.map((attr) => [attr.name, attr.value]),
  );
  const { src, type: __, ...props } = attrs;
  return { path: src, props, element };
}

export function getClientIslands(document: Document): Island[] {
  return selectAll(document, {
    tag: "script",
    attributes: { type: "application/client-island" },
  }).map(getIslandFromElement);
}

export function getServerIslands(document: Document): Island[] {
  return selectAll(document, {
    tag: "script",
    attributes: { type: "application/server-island" },
  }).map(getIslandFromElement);
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
    parse5.parseFragment(`<script defer src="${src}"></script>`)
      .childNodes[0],
  );
}

export function stringify(document: Document): string {
  return parse5.serialize(document);
}
