import { assertEquals, assertThrows } from "@std/assert";

import { createIsland, uniqueIslands } from "./island.ts";

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
