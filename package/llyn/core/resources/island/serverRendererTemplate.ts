import React from "react";
import { renderToReadableStream } from "react-dom/server.edge";
/*{ llyn-imports }*/

export const isDev = false;

// deno-lint-ignore no-unused-vars -- Used by generated switch cases.
function render(
  component: React.ElementType,
  props: Record<string, string | boolean>,
): Response {
  const { readable, writable } = new TransformStream<Uint8Array>();
  void renderToReadableStream(React.createElement(component, props))
    .then((stream) => stream.pipeTo(writable))
    .catch(async (error) => {
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

export function serveIsland(req: Request): Response {
  const url = new URL(req.url);
  const id = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  // deno-lint-ignore no-unused-vars -- Used by generated switch cases.
  const props = {
    ...Object.fromEntries(url.searchParams),
    _prerender: false,
  };

  switch (id) {
    /*{ llyn-switch-cases }*/
    default:
      return new Response("Not Found", { status: 404 });
  }
}

export function serveStaticForDev(_req: Request): Response {
  throw new Error("serveStaticForDev is not available in production");
}
