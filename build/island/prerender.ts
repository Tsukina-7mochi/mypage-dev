import React from "react";
import { renderToString } from "react-dom/server";

export type Island = {
  id: string;
  path: string;
  // Props are provided as attributes in the HTML, so they are always strings.
  props: Record<string, string>;
};

export async function prerender(island: Island): Promise<string> {
  const module = await import(island.path);
  if (!("default" in module)) {
    throw Error(`No default export in ${island.path}`);
  }
  const element = React.createElement(module.default, island.props);
  return `<div id="${island.id}">${renderToString(element)}</div>`;
}
