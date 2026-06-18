import { Hono } from "hono";
import { streamText } from "hono/streaming";
import * as llyn from "llyn/runtime";

import type { Bindings } from "./bindings.ts";

const app = new Hono<Bindings>().get("/:id", async (c) => {
  const { id } = c.req.param();
  const island = await llyn.renderIsland(id);
  if (island === null) {
    return c.notFound();
  } else {
    return streamText(c, (s) => s.pipe(island));
  }
});

export default app;
