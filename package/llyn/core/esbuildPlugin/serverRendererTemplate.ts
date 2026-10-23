import React from "react";
import { renderToReadableStream } from "react-dom/server.edge";
/*{ llyn-imports }*/

export const startDevBuild = () => Promise.resolve(undefined);

const bootId: string | undefined = /*{ llyn-boot-id }*/ undefined;

export function serveLiveReload(): Response {
  if (bootId === undefined) {
    return new Response("Not Found", { status: 404 });
  }
  const body = new TextEncoder().encode(`event: boot\ndata: ${bootId}\n\n`);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(body);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

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

export function serveIsland(req: Request): Promise<Response> {
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
      return Promise.resolve(new Response("Not Found", { status: 404 }));
  }
}
