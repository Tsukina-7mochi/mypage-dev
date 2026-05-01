import React from "react";
import { renderToString } from "react-dom/server";
import { Island } from "../types.ts";

export async function prerender(island: Island): Promise<string> {
  const module = await import(island.path);
  if (!("default" in module)) {
    throw Error(`No default export in ${island.path}`);
  }
  const element = React.createElement(module.default, island.props);
  return `<div id="${island.id}">${renderToString(element)}</div>`;
}
