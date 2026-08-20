import { hc, parseResponse } from "hono/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { type ApiType } from "../src/api/index.ts";

const NUM_FEED_ITEMS = 5;
const isPrerender = !!new URL(import.meta.url).searchParams.get("prerender");
const client = hc<ApiType>("http://localhost:8080/api");

async function Feed() {
  const feed = await parseResponse(client.feed.$get()).catch((err) => {
    console.error("Failed to fetch feed:", err);
    return null;
  });

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

function Fallback() {
  return <p className="fallback">Loading...</p>;
}

export default function () {
  return (
    <>
      <hgroup>
        <h2>Feed</h2>
        <p>
          from <a href="https://qiita.com/Tsukina_7mochi">Qiita</a>
        </p>
      </hgroup>

      <ErrorBoundary fallback={<p className="fallback">[Load Failed]</p>}>
        <Suspense fallback={<Fallback />}>
          {isPrerender ? <Fallback /> : <Feed />}
        </Suspense>
      </ErrorBoundary>
      <div className="cosmetic" />
    </>
  );
}
