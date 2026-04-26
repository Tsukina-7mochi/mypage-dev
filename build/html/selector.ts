import type { DefaultTreeAdapterTypes } from "parse5";

type Element = DefaultTreeAdapterTypes.Element;
type Document = DefaultTreeAdapterTypes.Document;

type Selector = {
  tag?: string;
  attributes?: Record<string, string>;
};

function elementMatches(element: Element, selector: Selector): boolean {
  if (selector.tag && element.tagName !== selector.tag) {
    return false;
  }

  const attrs = Object.fromEntries(
    element.attrs.map((attr) => [attr.name, attr.value]),
  );
  for (const [key, value] of Object.entries(selector.attributes ?? {})) {
    if (attrs[key] !== value) return false;
  }

  return true;
}

export function selectOne(
  element: Element | Document,
  selector: Selector,
): Element | null {
  for (const node of element.childNodes) {
    if ("tagName" in node && node.tagName !== "template") {
      if (elementMatches(node, selector)) {
        return node;
      }
      const element = selectOne(node, selector);
      if (element) {
        return element;
      }
    }
  }
  return null;
}

export function selectAll(
  element: Element | Document,
  selector: Selector,
): Element[] {
  const result: Element[] = [];
  for (const node of element.childNodes) {
    if ("tagName" in node && node.tagName !== "template") {
      if (elementMatches(node, selector)) {
        result.push(node);
      }
      for (const element of selectAll(node, selector)) {
        result.push(element);
      }
    }
  }

  return result;
}
