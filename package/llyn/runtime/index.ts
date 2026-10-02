import * as path from "@std/path";

import { loadConfig, runBuild } from "../core/index.ts";
import { copyPublic } from "../build/main.ts";
import { DevContext } from "./devContext.ts";
import { parseIslandRequest, renderIslandResponse } from "./render.ts";

export type { DevContext };

const bootId = crypto.randomUUID();

export async function startDevBuild(): Promise<DevContext | undefined> {
  const config = await loadConfig();
  const islands = await runBuild(config, {
    dev: true,
    liveReload: true,
    worker: false,
  });
  await copyPublic(config);
  console.log("dev build finished");
  return {
    islands: new Map(islands.map((island) => [island.id, island.url])),
    staticDir: path.fromFileUrl(new URL("static/", config.dist)),
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

export function serveLiveReload(_req: Request, _ctx?: DevContext): Response {
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
