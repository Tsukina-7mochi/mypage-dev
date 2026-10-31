import { assertEquals, assertStringIncludes } from "@std/assert";
import * as parse5 from "parse5";
import * as parse5Dom from "parse5-dom";
import * as path from "@std/path";

import { Context } from "./context.ts";
import { Island, IslandKind } from "./island.ts";
import { LoadedDocument } from "./load.ts";
import { CollectedDocument } from "./scan.ts";
import { renderDocument, writeDocument } from "./render.ts";
import { endPoint } from "./resources/html/liveReload.ts";

let temporaryDirectory: string;
let routes: string;
let staticDist: string;
let island: Island;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  routes = path.join(temporaryDirectory, "routes");
  staticDist = path.join(temporaryDirectory, "dist", "static");
  await Deno.mkdir(routes, { recursive: true });
  const islandPath = path.join(routes, "card.tsx");
  await Deno.writeTextFile(
    islandPath,
    "export default function Card() { return <section>card</section>; }",
  );
  island = {
    id: "1234abcd",
    specifier: "card.tsx",
    url: path.toFileUrl(islandPath),
  };
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

function context(options: { dev?: boolean; liveReload?: boolean } = {}) {
  return {
    dev: options.dev ?? true,
    liveReload: options.liveReload ?? false,
    root: path.toFileUrl(routes + "/"),
    staticDist: path.toFileUrl(staticDist + "/"),
  } satisfies Context;
}

function loaded(html: string): LoadedDocument {
  return {
    url: path.toFileUrl(path.join(routes, "index.html")),
    outPath: path.join(staticDist, "index.html"),
    document: parse5.parse(html),
  };
}

// Pairs the island script elements of the document with instances in order.
function collected(html: string, kinds: IslandKind[]): CollectedDocument {
  const doc = loaded(html);
  const elements = parse5Dom.selectAll(doc.document, { tag: "script" });
  return {
    ...doc,
    islands: kinds.map((kind, index) => ({
      instance: {
        island,
        kind,
        domId: `${island.id}-${index}`,
        props: { label: `${index}` },
      },
      element: elements[index],
    })),
    scripts: [],
    stylesheets: [],
  };
}

const twoIslands = `
  <script type="application/client-island" src="./card.tsx"></script>
  <script type="application/static-island" src="./card.tsx"></script>
`;

Deno.test("document is written to its output path", async () => {
  const doc = loaded("<p>page</p>");
  await writeDocument(doc, context());
  assertEquals(
    await Deno.readTextFile(doc.outPath),
    parse5.serialize(doc.document),
  );
});

Deno.test("document output is minified in production", async () => {
  const doc = loaded(
    "<html>\n<head></head>\n<body>\n<p>page</p>\n</body>\n</html>",
  );
  await writeDocument(doc, context({ dev: false }));
  assertEquals((await Deno.readTextFile(doc.outPath)).includes("\n"), false);
});

Deno.test("islands are replaced with their prerendered html", async () => {
  const doc = collected(twoIslands, ["client", "static"]);
  await renderDocument(doc, context());

  const html = parse5.serialize(doc.document);
  assertStringIncludes(html, '<div id="1234abcd-0"></div>');
  assertStringIncludes(html, '<div id="1234abcd-1"><section>card</section>');
  assertEquals(html.includes("-island"), false);
});

Deno.test("asset references are rewritten to the built outputs", async () => {
  const doc = loaded(
    '<link rel="stylesheet" href="./index.css"><script src="./main.ts"></script>',
  );
  const [stylesheet] = parse5Dom.selectAll(doc.document, { tag: "link" });
  const [script] = parse5Dom.selectAll(doc.document, { tag: "script" });
  const sourceFile = { in: "", out: "" };
  await renderDocument({
    ...doc,
    islands: [],
    scripts: [{ element: script, reference: "/main.js", sourceFile }],
    stylesheets: [{ element: stylesheet, reference: "/index.css", sourceFile }],
  }, context());

  const html = parse5.serialize(doc.document);
  assertStringIncludes(html, '<link rel="stylesheet" href="/index.css">');
  assertStringIncludes(html, '<script src="/main.js" type="module"></script>');
});

Deno.test("bootstrap is rendered and placed inside the html element", async () => {
  const doc = collected(twoIslands, ["client", "static"]);
  const virtualFiles = await renderDocument(doc, context());

  assertEquals(
    virtualFiles.map(({ in: input, out }) => ({ in: input, out })),
    [{
      in: path.join(routes, "index.html.bootstrap.ts"),
      out: path.join(staticDist, "index-bootstrap"),
    }],
  );
  assertStringIncludes(
    virtualFiles[0].content,
    'bootstrapClientIsland("1234abcd-0", Island_1234abcd, {"label":"0","_prerender":false})',
  );
  assertEquals(virtualFiles[0].content.includes("1234abcd-1"), false);
  assertStringIncludes(
    parse5.serialize(doc.document),
    '<script type="module" src="index-bootstrap.js"></script></html>',
  );
});

Deno.test("bootstrap is omitted without client or server islands", async () => {
  const doc = collected(
    '<script type="application/static-island" src="./card.tsx"></script>',
    ["static"],
  );
  const virtualFiles = await renderDocument(doc, context());

  assertEquals(virtualFiles, []);
  assertEquals(parse5.serialize(doc.document).includes("bootstrap"), false);
});

Deno.test("live reload script is placed once inside the html element", async () => {
  const doc = collected("", []);
  await renderDocument(doc, context({ liveReload: true }));

  const html = parse5.serialize(doc.document);
  assertEquals(html.split(endPoint).length - 1, 1);
  assertStringIncludes(html, "</script></html>");
});
