import type { DefaultTreeAdapterTypes, Token } from "parse5";
import { ObjectEntries } from "./types.ts";

type Attribute = Token.Attribute;
type Element = DefaultTreeAdapterTypes.Element;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;

export type Selector = {
  tag?: string;
  attributes?: Record<string, string>;
};
export type SelectedElement<S extends Selector> = Element & {
  tag: S["tag"] extends string ? S["tag"] : string;
  attrs:
    & Attribute[]
    & (S["attributes"] extends Record<string, string>
      ? ObjectEntries<S["attributes"]>
      : Attribute[]);
};

function elementMatches<S extends Selector>(
  element: Element,
  selector: S,
): element is SelectedElement<S> {
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

export function selectOne<S extends Selector>(
  element: ParentNode,
  selector: S,
): SelectedElement<S> | null {
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

export function selectAll<S extends Selector>(
  element: ParentNode,
  selector: S,
): SelectedElement<S>[] {
  const result: SelectedElement<S>[] = [];
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
