import { assertEquals } from "@std/assert";
import * as parse5 from "parse5";
import * as path from "@std/path";

import { Context } from "./context.ts";
import { LoadedDocument } from "./load.ts";
import { writeDocument } from "./render.ts";

let temporaryDirectory: string;
let doc: LoadedDocument;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  doc = {
    url: path.toFileUrl(path.join(temporaryDirectory, "routes", "index.html")),
    outPath: path.join(temporaryDirectory, "dist", "static", "index.html"),
    document: parse5.parse(
      "<html>\n<head></head>\n<body>\n<p>page</p>\n</body>\n</html>",
    ),
  };
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

function context(dev: boolean): Context {
  return {
    dev,
    liveReload: false,
    root: path.toFileUrl(path.join(temporaryDirectory, "routes") + "/"),
    staticDist: path.toFileUrl(
      path.join(temporaryDirectory, "dist", "static") + "/",
    ),
  };
}

Deno.test("document is written to its output path", async () => {
  await writeDocument(doc, context(true));
  assertEquals(
    await Deno.readTextFile(doc.outPath),
    parse5.serialize(doc.document),
  );
});

Deno.test("document output is minified in production", async () => {
  await writeDocument(doc, context(false));
  assertEquals((await Deno.readTextFile(doc.outPath)).includes("\n"), false);
});
