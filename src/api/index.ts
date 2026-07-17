import { Hono } from "hono";
import { cache } from "hono/cache";
import { HTTPException } from "hono/http-exception";

import contributionHistory from "./contributionHistory.ts";
import feed from "./feed.ts";

import type { Bindings } from "../bindings.ts";

const app = new Hono<Bindings>()
  .route("/feed", feed)
  .use(
    cache({
      cacheName: "mypage-dev-api",
      cacheControl: "max-age=3600",
      wait: !!Deno,
    }),
  )
  .route("/contributionHistory", contributionHistory)
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    console.error(err);
    return c.text("Internal Server Error", 500);
  });

export default app;
export type ApiType = typeof app;
