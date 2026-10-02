import React from "react";
import { renderToReadableStream } from "react-dom/server.edge";

export function renderIslandResponse(
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

export function parseIslandRequest(
  req: Request,
): { id: string; props: Record<string, string | boolean> } {
  const url = new URL(req.url);
  return {
    id: url.pathname.slice(url.pathname.lastIndexOf("/") + 1),
    props: { ...Object.fromEntries(url.searchParams), _prerender: false },
  };
}
