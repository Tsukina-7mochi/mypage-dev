import * as parse5 from "parse5";

import { generateIslandId } from "../../island.ts";
import { endPoint } from "./liveReload.ts";
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
  const { virtualFiles } = await htmlNodeProcessor(
    new URL("file:///site/routes/index.html"),
    document,
    {
      dev: true,
      liveReload: false,
      root: new URL("file:///site/routes/"),
      staticDist: new URL("file:///site/dist/static/"),
    },
  );
  const bootstrap = virtualFiles[0].content;

  const id = await generateIslandId("counter.tsx");
  const html = parse5.serialize(document);
  assertIncludes(html, `id="${id}-0"`);
  assertIncludes(html, `id="${id}-1"`);
  assertIncludes(bootstrap, `bootstrapClientIsland("${id}-0"`);
  assertIncludes(bootstrap, `bootstrapClientIsland("${id}-1"`);
  assertIncludes(bootstrap, '{"label":"first","_prerender":false}');
  assertIncludes(bootstrap, '{"label":"second","_prerender":false}');
});

Deno.test("places the bootstrap script inside the html element", async () => {
  const document = parse5.parse(`
    <script type="application/client-island" src="./counter.tsx"></script>
  `);
  await htmlNodeProcessor(
    new URL("file:///site/routes/index.html"),
    document,
    {
      dev: true,
      liveReload: false,
      root: new URL("file:///site/routes/"),
      staticDist: new URL("file:///site/dist/static/"),
    },
  );

  const html = parse5.serialize(document);
  assertIncludes(
    html,
    '<script type="module" src="index-bootstrap.js"></script></html>',
  );
});

Deno.test("places the live reload script inside the html element", async () => {
  const document = parse5.parse("");
  await htmlNodeProcessor(
    new URL("file:///site/routes/index.html"),
    document,
    {
      dev: true,
      liveReload: true,
      root: new URL("file:///site/routes/"),
      staticDist: new URL("file:///site/dist/static/"),
    },
  );

  const html = parse5.serialize(document);
  assertIncludes(html, endPoint);
  assertIncludes(html, "</script></html>");
});
