import { assertEquals, assertThrows } from "@std/assert";

import {
  createIsland,
  Island,
  IslandInstance,
  IslandKind,
  uniqueIslands,
  uniqueServerIslands,
} from "./island.ts";

Deno.test("createIsland derives its specifier and stable ID from the root", async () => {
  const island = await createIsland(
    new URL("file:///site/routes/"),
    new URL("file:///site/routes/blog/feed.tsx"),
  );

  assertEquals(island.specifier, "blog/feed.tsx");
  assertEquals(island.id.length, 8);
});

Deno.test("createIsland keeps islands outside the root", async () => {
  const island = await createIsland(
    new URL("file:///site/routes/"),
    new URL("file:///site/components/card.tsx"),
  );

  assertEquals(island.specifier, "../components/card.tsx");
});

Deno.test("uniqueIslands rejects ID collisions", () => {
  assertThrows(
    () =>
      uniqueIslands([
        {
          id: "deadbeef",
          specifier: "first.tsx",
          url: new URL("file:///site/routes/first.tsx"),
        },
        {
          id: "deadbeef",
          specifier: "second.tsx",
          url: new URL("file:///site/routes/second.tsx"),
        },
      ]),
    Error,
    "first.tsx and second.tsx",
  );
});

function islandOf(id: string, specifier: string): Island {
  return { id, specifier, url: new URL(`file:///site/routes/${specifier}`) };
}

function instanceOf(island: Island, kind: IslandKind): IslandInstance {
  return { island, kind, domId: `${island.id}-0`, props: {} };
}

Deno.test("uniqueServerIslands keeps each server island once", () => {
  const feed = islandOf("aaaaaaaa", "feed.tsx");
  const counter = islandOf("bbbbbbbb", "counter.tsx");

  assertEquals(
    uniqueServerIslands([
      instanceOf(feed, "server"),
      instanceOf(counter, "client"),
      instanceOf(feed, "server"),
    ]),
    [feed],
  );
});

Deno.test("uniqueServerIslands rejects ID collisions with other kinds", () => {
  assertThrows(
    () =>
      uniqueServerIslands([
        instanceOf(islandOf("deadbeef", "first.tsx"), "client"),
        instanceOf(islandOf("deadbeef", "second.tsx"), "server"),
      ]),
    Error,
    "first.tsx and second.tsx",
  );
});
