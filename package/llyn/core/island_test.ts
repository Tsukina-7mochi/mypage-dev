import { assertEquals } from "@std/assert";

import { createIsland } from "./island.ts";

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
