import { assertEquals, assertRejects, assertThrows } from "@std/assert";

import { createIsland, createIslandResolver } from "./island.ts";

Deno.test("createIsland derives its specifier and stable ID from the root", async () => {
  const island = await createIsland(
    new URL("file:///site/routes/"),
    new URL("file:///site/routes/blog/feed.tsx"),
  );

  assertEquals(island.specifier, "blog/feed.tsx");
  assertEquals(island.id.length, 8);
});

Deno.test("createIslandResolver rejects ID collisions", () => {
  assertThrows(
    () =>
      createIslandResolver([
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

Deno.test("createIslandResolver rejects islands outside the config", async () => {
  const resolve = createIslandResolver([]);
  await assertRejects(
    () => resolve(new URL("file:///site/routes/missing.tsx")),
    Error,
    "missing.tsx",
  );
});
