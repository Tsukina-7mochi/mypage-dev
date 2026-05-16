import * as parse5 from "parse5";
import * as parse5Dom from "parse5-dom";

type ParentNode = parse5.DefaultTreeAdapterTypes.ParentNode;
type Element = parse5.DefaultTreeAdapterTypes.Element;
export type Document = parse5.DefaultTreeAdapterTypes.Document;

type IslandElement = {
  element: Element;
  src: string;
  props: Record<string, string>;
};

type ElementWithPath = {
  path: string;
  element: Element;
};

type ResourceReferences = {
  clientIslands: IslandElement[];
  serverIslands: IslandElement[];
  scripts: ElementWithPath[];
  styles: ElementWithPath[];
};

function getIslandFromElement(element: Element): IslandElement {
  const attrs = Object.fromEntries(
    element.attrs.map((attr) => [attr.name, attr.value]),
  );
  const { src, type: __, ...props } = attrs;
  return { src, props, element };
}

export function getClientIslands(node: ParentNode): IslandElement[] {
  return parse5Dom.selectAll(node, {
    tag: "script",
    attributes: { type: "application/client-island" },
  }).map(getIslandFromElement);
}

export function getServerIslands(node: ParentNode): IslandElement[] {
  return parse5Dom.selectAll(node, {
    tag: "script",
    attributes: { type: "application/server-island" },
  }).map(getIslandFromElement);
}

export function getScripts(node: ParentNode): ElementWithPath[] {
  return parse5Dom.selectAll(node, {
    tag: "script",
  }).filter((element) => {
    const type = parse5Dom.getAttribute(element, "type");
    return type === null || (!type.startsWith("application/"));
  }).map((element) => {
    const src = parse5Dom.getAttribute(element, "src");
    if (!src) {
      throw Error("script element missing src attribute");
    }
    return { element, path: src };
  });
}

export function getStylesheets(node: ParentNode): ElementWithPath[] {
  return parse5Dom.selectAll(node, {
    tag: "link",
    attributes: { rel: "stylesheet" },
  }).map((element) => {
    const href = parse5Dom.getAttribute(element, "href");
    if (!href) {
      throw Error("link element missing href attribute");
    }
    return { element, path: href };
  });
}
