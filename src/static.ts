import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import type { Bindings } from "./bindings.ts";

export function createStaticRoute(root: string) {
  return new Hono<Bindings>().use("*", serveStatic({ root }));
}
