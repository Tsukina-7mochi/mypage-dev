import React from "react";
import { renderToReadableStream } from "react-dom/server";

const islands: Record<string, React.ReactNode> = {};

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/_islands/")) {
      return new Response("Not Found", { status: 404 });
    }

    const id = url.pathname.slice(10);
    if (!(id in islands)) {
      return new Response("Not Found", { status: 404 });
    }

    const stream = await renderToReadableStream(islands[id]);
    return new Response(stream);
  },
};
