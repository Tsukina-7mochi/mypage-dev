import * as path from "@std/path";
import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import type { Bindings } from "./bindings.ts";

const app = new Hono<Bindings>().use(
  "*",
  serveStatic({
    root: path.join(import.meta.dirname ?? "", "static/"),
  }),
);

export default app;
