import * as path from "@std/path";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveIsland, serveLiveReload, startDevBuild } from "llyn/runtime";

import apiRoute from "./api/index.ts";
import { createStaticRoute } from "./static.ts";

import type { Bindings } from "./bindings.ts";

const ctx = await startDevBuild();

const app = new Hono<Bindings>()
  .use(logger())
  .all("/_islands/*", (c) => serveIsland(c.req.raw, ctx))
  .get("/__reload", (c) => serveLiveReload(c.req.raw, ctx))
  .route("/api", apiRoute);

if (typeof Deno !== "undefined") {
  app.route(
    "/",
    createStaticRoute(
      ctx?.staticDir ?? path.join(import.meta.dirname ?? "", "static/"),
    ),
  );
}

export default { fetch: app.fetch };
