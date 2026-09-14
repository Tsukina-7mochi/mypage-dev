import * as parse5 from "parse5";

import { generateIslandId } from "../../islandId.ts";
import { createContext } from "../../processor.ts";
import { htmlNodeProcessor } from "./processor.ts";

function assertIncludes(actual: string, expected: string): void {
  if (!actual.includes(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(actual)} to include ${expected}`,
    );
  }
}

Deno.test("assigns distinct DOM IDs and props to island instances", async () => {
  const document = parse5.parse(`
    <script
      type="application/client-island"
      src="./counter.tsx"
      label="first"
    ></script>
    <script
      type="application/client-island"
      src="./counter.tsx"
      label="second"
    ></script>
  `);
  let bootstrap = "";
  const ctx = createContext({
    dev: true,
    liveReload: false,
    root: new URL("file:///site/routes/"),
    dist: new URL("file:///site/dist/"),
    staticDist: new URL("file:///site/dist/static/"),
    registerSourceFile() {},
    registerVirtualFile(_input, _output, content) {
      bootstrap = content;
    },
    registerIsland() {},
    registerServerIsland() {},
  });

  await htmlNodeProcessor(
    new URL("file:///site/routes/index.html"),
    document,
    ctx,
  );

  const id = await generateIslandId("counter.tsx");
  const html = parse5.serialize(document);
  assertIncludes(html, `id="${id}-0"`);
  assertIncludes(html, `id="${id}-1"`);
  assertIncludes(bootstrap, `bootstrapClientIsland("${id}-0"`);
  assertIncludes(bootstrap, `bootstrapClientIsland("${id}-1"`);
  assertIncludes(bootstrap, '{"label":"first"}');
  assertIncludes(bootstrap, '{"label":"second"}');
});
