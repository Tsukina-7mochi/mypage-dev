import * as path from "@std/path";

import { Island, IslandInstance } from "../../island.ts";
import { prerenderServerIsland, prerenderStaticIsland } from "./prerender.ts";

const islandSource = `type Props = {
  _prerender: boolean;
  label?: string;
};

export default function TestIsland({ _prerender, label }: Props) {
  return (
    <p data-prerender={String(_prerender)}>
      {label}
    </p>
  );
}
`;

let temporaryDirectory: string;
let island: Island;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  const islandPath = path.join(temporaryDirectory, "island.tsx");
  await Deno.writeTextFile(islandPath, islandSource);
  island = {
    id: "1234abcd",
    specifier: "island.tsx",
    url: path.toFileUrl(islandPath),
  };
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

Deno.test("server and static prerenders inject _prerender=true", async () => {
  const instance: IslandInstance = {
    island,
    kind: "server",
    domId: "1234abcd-0",
    props: { label: "prerendered", _prerender: "forged" },
  };
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
