import { Hono } from "hono";
import { logger } from "hono/logger";

import apiRoute from "./api/index.ts";
import islandRoute from "./island.ts";
import staticRoute from "./static.ts";

import type { Bindings } from "./bindings.ts";

const app = new Hono<Bindings>()
  .use(logger())
  .route("/_islands", islandRoute)
  .route("/api", apiRoute);

if (typeof Deno !== "undefined") {
  app.route("/", staticRoute);
}

export default { fetch: app.fetch };
