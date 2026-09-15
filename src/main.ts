import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveIsland } from "llyn/runtime";

import apiRoute from "./api/index.ts";
import staticRoute from "./static.ts";

import type { Bindings } from "./bindings.ts";

const app = new Hono<Bindings>()
  .use(logger())
  .all("/_islands/*", (c) => serveIsland(c.req.raw))
  .route("/api", apiRoute);

if (typeof Deno !== "undefined") {
  app.route("/", staticRoute);
}

export default { fetch: app.fetch };
