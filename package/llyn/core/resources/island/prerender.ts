import React from "react";
import { IslandInstance } from "../../types.ts";
import {
  renderToReadableStream,
  renderToStaticMarkup,
} from "react-dom/server.edge";

export function prerenderClientIsland(
  instance: IslandInstance,
): Promise<string> {
  return Promise.resolve(`<div id="${instance.domId}"></div>`);
}

export async function prerenderServerIsland(
  instance: IslandInstance,
): Promise<string> {
  const module = await import(instance.island.url.href);
  if (!("default" in module)) {
    throw Error(`No default export in ${instance.island.url.pathname}`);
  }
  const element = React.createElement(module.default, {
    ...instance.props,
    _prerender: true,
  });
  const rendered = renderToStaticMarkup(element);
  return `<div id="${instance.domId}">${rendered}</div>`;
}

export async function prerenderStaticIsland(
  instance: IslandInstance,
): Promise<string> {
  const module = await import(instance.island.url.href);
  if (!("default" in module)) {
    throw Error(`No default export in ${instance.island.url.pathname}`);
  }
  const element = React.createElement(module.default, {
    ...instance.props,
    _prerender: true,
  });
  const stream = await renderToReadableStream(element);
  await stream.allReady;

  let rendered = "";
  for await (const chunk of stream.pipeThrough(new TextDecoderStream())) {
    rendered += chunk;
  }

  return `<div id="${instance.domId}">${rendered}</div>`;
}
