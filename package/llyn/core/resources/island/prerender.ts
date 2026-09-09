import React from "react";
import { Island } from "../../types.ts";
import {
  renderToReadableStream,
  renderToStaticMarkup,
} from "react-dom/server.edge";

export function prerenderClientIsland(island: Island): Promise<string> {
  return Promise.resolve(`<div id="${island.id}"></div>`);
}

export async function prerenderServerIsland(island: Island): Promise<string> {
  const module = await import(`${island.url}?prerender=true`);
  if (!("default" in module)) {
    throw Error(`No default export in ${island.url.pathname}`);
  }
  const element = React.createElement(module.default, island.props);
  const rendered = renderToStaticMarkup(element);
  return `<div id="${island.id}">${rendered}</div>`;
}

export async function prerenderStaticIsland(island: Island): Promise<string> {
  const module = await import(`${island.url}?prerender=true`);
  if (!("default" in module)) {
    throw Error(`No default export in ${island.url.pathname}`);
  }
  const element = React.createElement(module.default, island.props);
  const stream = await renderToReadableStream(element);
  await stream.allReady;

  let rendered = "";
  for await (const chunk of stream.pipeThrough(new TextDecoderStream())) {
    rendered += chunk;
  }

  return `<div id="${island.id}">${rendered}</div>`;
}
