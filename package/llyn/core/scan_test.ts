import { assertEquals } from "@std/assert";
import * as parse5 from "parse5";

import { generateIslandId } from "./island.ts";
import { scanDocuments } from "./scan.ts";

const ctx = {
  dev: true,
  liveReload: false,
  root: new URL("file:///site/routes/"),
  staticDist: new URL("file:///site/dist/static/"),
};

function scan(html: string) {
  return scanDocuments([{
    url: new URL("file:///site/routes/blog/index.html"),
    outPath: "/site/dist/static/blog/index.html",
    document: parse5.parse(html),
  }], ctx);
}

Deno.test("island instances get DOM IDs in client, server, static order", async () => {
  const [doc] = await scan(`
    <script type="application/static-island" src="../card.tsx"></script>
    <script type="application/server-island" src="../feed.tsx"></script>
    <script
      type="application/client-island"
      src="../counter.tsx"
      label="first"
    ></script>
    <script
      type="application/client-island"
      src="../counter.tsx"
      label="second"
    ></script>
  `);

  const counter = await generateIslandId("counter.tsx");
  const feed = await generateIslandId("feed.tsx");
  const card = await generateIslandId("card.tsx");
  assertEquals(
    doc.islands.map(({ instance }) => ({
      kind: instance.kind,
      domId: instance.domId,
      props: instance.props,
    })),
    [
      { kind: "client", domId: `${counter}-0`, props: { label: "first" } },
      { kind: "client", domId: `${counter}-1`, props: { label: "second" } },
      { kind: "server", domId: `${feed}-2`, props: {} },
      { kind: "static", domId: `${card}-3`, props: {} },
    ],
  );
  assertEquals(
    doc.islands.map(({ element }) => element.tagName),
    ["script", "script", "script", "script"],
  );
});

Deno.test("scripts and stylesheets reference their built outputs", async () => {
  const [doc] = await scan(`
    <link rel="stylesheet" href="./blog.css">
    <script src="../main.ts"></script>
  `);

  assertEquals(
    doc.scripts.map(({ reference, sourceFile }) => ({ reference, sourceFile })),
    [{
      reference: "/main.js",
      sourceFile: {
        in: "/site/routes/main.ts",
        out: "/site/dist/static/main",
      },
    }],
  );
  assertEquals(
    doc.stylesheets.map(({ reference, sourceFile }) => ({
      reference,
      sourceFile,
    })),
    [{
      reference: "/blog/blog.css",
      sourceFile: {
        in: "/site/routes/blog/blog.css",
        out: "/site/dist/static/blog/blog",
      },
    }],
  );
});
