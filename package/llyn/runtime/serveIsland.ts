import React from "react";
import { renderToReadableStream } from "react-dom/server.edge";

import { DevContext } from "./devContext.ts";

function renderIslandResponse(
  component: React.ElementType,
  props: Record<string, string | boolean>,
): Response {
  const { readable, writable } = new TransformStream<Uint8Array>();
  void renderToReadableStream(React.createElement(component, props))
    .then((stream) => stream.pipeTo(writable))
    .catch(async (error) => {
      console.error("Failed to render island", error);
      try {
        await writable.abort(error);
      } catch (abortError) {
        console.warn("Failed to abort island render stream", abortError);
      }
    });

  return new Response(readable, {
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}

function parseIslandRequest(
  req: Request,
): { id: string; props: Record<string, string | boolean> } {
  const url = new URL(req.url);
  return {
    id: url.pathname.slice(url.pathname.lastIndexOf("/") + 1),
    props: { ...Object.fromEntries(url.searchParams), _prerender: false },
  };
}

export async function serveIsland(
  req: Request,
  ctx?: DevContext,
): Promise<Response> {
  if (!ctx) {
    throw new Error("serveIsland requires the context from startDevBuild");
  }
  const { id, props } = parseIslandRequest(req);
  const url = ctx.islands.get(id);
  if (!url) {
    return new Response("Not Found", { status: 404 });
  }
  const module = await import(url.href);
  return renderIslandResponse(module.default, props);
}
