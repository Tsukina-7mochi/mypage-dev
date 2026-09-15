import { IslandInstance } from "../../types.ts";
import { prerenderServerIsland, prerenderStaticIsland } from "./prerender.ts";

const instance: IslandInstance = {
  island: {
    id: "1234abcd",
    specifier: "testdata/island.tsx",
    url: new URL("./testdata/island.tsx", import.meta.url),
  },
  kind: "server",
  domId: "1234abcd-0",
  props: { label: "prerendered", _prerender: "forged" },
};

Deno.test("server and static prerenders inject _prerender=true", async () => {
  const expected =
    '<div id="1234abcd-0"><p data-prerender="true">prerendered</p></div>';

  const server = await prerenderServerIsland(instance);
  if (server !== expected) {
    throw new Error(`Unexpected server prerender: ${server}`);
  }

  const staticIsland = await prerenderStaticIsland({
    ...instance,
    kind: "static",
  });
  if (staticIsland !== expected) {
    throw new Error(`Unexpected static prerender: ${staticIsland}`);
  }
});
