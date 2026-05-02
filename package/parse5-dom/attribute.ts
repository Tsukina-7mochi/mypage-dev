import * as parse5 from "parse5";

type Element = parse5.DefaultTreeAdapterTypes.Element;

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
