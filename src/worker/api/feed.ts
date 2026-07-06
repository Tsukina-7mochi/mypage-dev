import { Hono } from "hono";
import * as v from "valibot";

import type { Bindings } from "../bindings.ts";

const url =
  "https://qiita.com/api/v2/items?page=1&per_page=20&query=user%3ATsukina_7mochi";

const QiitaPostSchema = v.looseObject({
  title: v.string(),
  url: v.string(),
  created_at: v.string(),
  body: v.string(),
});
const QiitaPostsSchema = v.array(QiitaPostSchema);

const app = new Hono<Bindings>().get("/", async (c) => {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return c.json({ error: "bad gateway" }, 502);
  }

  const data = v.parse(QiitaPostsSchema, await res.json());
  const result = data.map(
    (item) =>
      ({
        type: "qiita",
        title: item.title,
        url: item.url,
        body: item.body,
        createdAt: item.created_at,
      }) as const,
  );

  return c.json(result, 200);
});

export default app;
