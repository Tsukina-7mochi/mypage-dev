import { assertEquals, assertStringIncludes } from "@std/assert";
import * as parse5 from "parse5";
import * as parse5Dom from "parse5-dom";

import { Island, IslandInstance, IslandKind } from "./island.ts";
import { CollectedDocument } from "./document.ts";
import {
  bootstrapPaths,
  renderBootstrap,
  renderBootstraps,
} from "./bootstrap.ts";

const island: Island = {
  id: "1234abcd",
  specifier: "counter.tsx",
  url: new URL("file:///site/routes/counter.tsx"),
};

function createInstance(
  kind: IslandKind,
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

function collected(name: string, kinds: IslandKind[]): CollectedDocument {
  const document = parse5.parse("<script></script>");
  const element = parse5Dom.selectOne(document, { tag: "script" })!;
  return {
    url: new URL(`file:///site/routes/blog/${name}.md`),
    outPath: `/site/dist/static/blog/${name}.html`,
    document,
    islands: kinds.map((kind, index) => ({
      instance: createInstance(kind, index),
      element,
    })),
    scripts: [],
    stylesheets: [],
  };
}

Deno.test("bootstrap paths are derived from the document", () => {
  assertEquals(bootstrapPaths(collected("post", [])), {
    in: "/site/routes/blog/post.md.bootstrap.ts",
    out: "/site/dist/static/blog/post-bootstrap",
    src: "post-bootstrap.js",
  });
});

Deno.test("bootstraps are rendered only for pages with client or server islands", async () => {
  const bootstraps = await renderBootstraps([
    collected("client", ["client", "static"]),
    collected("static", ["static"]),
    collected("server", ["server"]),
  ]);

  assertEquals(
    bootstraps.map(({ in: input, out }) => ({ in: input, out })),
    [
      {
        in: "/site/routes/blog/client.md.bootstrap.ts",
        out: "/site/dist/static/blog/client-bootstrap",
      },
      {
        in: "/site/routes/blog/server.md.bootstrap.ts",
        out: "/site/dist/static/blog/server-bootstrap",
      },
    ],
  );
  assertStringIncludes(
    bootstraps[0].content,
    'bootstrapClientIsland("1234abcd-0"',
  );
  assertEquals(bootstraps[0].content.includes("1234abcd-1"), false);
  assertStringIncludes(
    bootstraps[1].content,
    'bootstrapServerIsland("1234abcd-0"',
  );
});
