import { Hono } from "hono";
import { cache } from "hono/cache";

import contributionHistory from "./contributionHistory.ts";
import feed from "./feed.ts";

import type { Bindings } from "../bindings.ts";

const app = new Hono<Bindings>()
  .route("/feed", feed)
  .use(
    cache({
      cacheName: "mypage-dev-api",
      cacheControl: "max-age=3600",
      wait: true, // only for deno
    }),
  )
  .route("/contributionHistory", contributionHistory);

export default app;
export type ApiType = typeof app;
