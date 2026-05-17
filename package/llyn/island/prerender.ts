import React from "react";
import { Island } from "../types.ts";
import { prerender } from "react-dom/static";
import { renderToStaticMarkup } from "react-dom/server";

export async function prerenderClientIsland(island: Island): Promise<string> {
  const module = await import(island.url.pathname);
  if (!("default" in module)) {
    throw Error(`No default export in ${island.url.pathname}`);
  }
  const element = React.createElement(module.default, island.props);

  const { prelude } = await prerender(element);
  // @ts-ignore: It just works
  const textPrelude = prelude.pipeThrough(new TextDecoderStream());
  let rendered = "";
  for await (const chunk of textPrelude) {
    rendered += chunk;
  }

  return `<div id="${island.id}">${rendered}</div>`;
}

export async function prerenderServerIsland(island: Island): Promise<string> {
  const module = await import(island.url.pathname);
  if (!("default" in module)) {
    throw Error(`No default export in ${island.url.pathname}`);
  }
  const element = React.createElement(module.default, island.props);
  const rendered = renderToStaticMarkup(element);
  return `<div id="${island.id}">${rendered}</div>`;
}
