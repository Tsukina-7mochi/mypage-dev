import { Island, IslandInstance } from "../../types.ts";
import { renderBootstrap } from "./bootstrap.ts";

const island: Island = {
  id: "1234abcd",
  specifier: "counter.tsx",
  url: new URL("file:///site/routes/counter.tsx"),
};

function createInstance(
  kind: "client" | "server",
  index: number,
): IslandInstance {
  return {
    island,
    kind,
    domId: `${island.id}-${index}`,
    props: { label: "hello world" },
  };
}

Deno.test("bootstrap passes runtime props and separates DOM and island IDs", async () => {
  const bootstrap = await renderBootstrap(
    [createInstance("client", 0)],
    [createInstance("server", 1)],
  );

  const expectations = [
    'import Island_1234abcd from "file:///site/routes/counter.tsx";',
    'bootstrapClientIsland("1234abcd-0", Island_1234abcd, {"label":"hello world","_prerender":false})',
    'bootstrapServerIsland("1234abcd-1", "1234abcd", {"label":"hello world"})',
    "new URLSearchParams(props).toString()",
    '`/_islands/${islandId}${search ? `?${search}` : ""}`',
  ];
  for (const expected of expectations) {
    if (!bootstrap.includes(expected)) {
      throw new Error(`Bootstrap does not include ${expected}`);
    }
  }
});
