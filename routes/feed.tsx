import { hc, parseResponse } from "hono/client";
import { Suspense, use } from "react";

import { type ApiType } from "../src/api/index.ts";

const NUM_FEED_ITEMS = 5;

const isPrerender =
  new URL(import.meta.url).searchParams.get("prerender") === "true";
const client = hc<ApiType>("http://localhost:8080/api");

function fetchFeed() {
  if (isPrerender) {
    return new Promise<never>(() => {});
  }
  return parseResponse(client.feed.$get()).catch((err) => {
    console.error("Failed to fetch feed:", err);
    return null;
  });
}

function FeedList(props: { feedPromise: ReturnType<typeof fetchFeed> }) {
  const feed = use(props.feedPromise);

  if (feed === null) {
    return <div className="error">Failed to load feed</div>;
  }

  return (
    <>
      {feed.slice(0, NUM_FEED_ITEMS).map((item) => (
        <article key={item.url}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </>
  );
}

export default function () {
  const feedPromise = fetchFeed();

  return (
    <>
      <hgroup>
        <h2>Feed</h2>
        <p>
          from <a href="https://qiita.com/Tsukina_7mochi">Qiita</a>
        </p>
      </hgroup>

      <Suspense fallback={<p className="loading">Loading...</p>}>
        <FeedList feedPromise={feedPromise} />
      </Suspense>
      <div className="cosmetic" />
    </>
  );
}
