import { DevContext } from "./devContext.ts";

const bootId = crypto.randomUUID();

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
