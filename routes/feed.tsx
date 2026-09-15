import { hc, type InferResponseType, parseResponse } from "hono/client";
import { Suspense } from "react";

import { type ApiType } from "../src/api/index.ts";

const NUM_FEED_ITEMS = 5;
const client = hc<ApiType>("http://localhost:8080/api");

type Feed = InferResponseType<typeof client.feed.$get, 200>;
type Props = { _prerender: boolean };

async function fetchFeed(): Promise<Feed | null> {
  try {
    return await parseResponse(client.feed.$get());
  } catch (e) {
    console.error("failed to fetch feed", e);
    return null;
  }
}

async function Feed() {
  const feed = await fetchFeed();
  if (feed === null) {
    return <ErrorFallback />;
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

function ErrorFallback() {
  return <p className="fallback">[Load Failed]</p>;
}

export default function ({ _prerender }: Props) {
  return (
    <>
      <hgroup>
        <h2>Feed</h2>
        <p>
          from <a href="https://qiita.com/Tsukina_7mochi">Qiita</a>
        </p>
      </hgroup>

      <Suspense fallback={<Fallback />}>
        {_prerender ? <Fallback /> : <Feed />}
      </Suspense>
      <div className="cosmetic" />
    </>
  );
}
