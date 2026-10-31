import { assertEquals, assertStringIncludes } from "@std/assert";
import * as parse5 from "parse5";
import * as path from "@std/path";

import { loadHtml } from "./html.ts";

let temporaryDirectory: string;
let routes: string;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  routes = path.join(temporaryDirectory, "routes");
  await Deno.mkdir(path.join(routes, "blog"), { recursive: true });
  await Deno.writeTextFile(
    path.join(routes, "blog", "index.html"),
    "<html><body><p>page</p></body></html>",
  );
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

Deno.test("html is parsed and output at the same path under the static dist", async () => {
  const doc = await loadHtml(
    path.toFileUrl(path.join(routes, "blog", "index.html")),
    {
      dev: true,
      liveReload: false,
      root: path.toFileUrl(routes + "/"),
      staticDist: path.toFileUrl(
        path.join(temporaryDirectory, "dist", "static") + "/",
      ),
    },
  );

  assertEquals(
    doc.outPath,
    path.join(temporaryDirectory, "dist", "static", "blog", "index.html"),
  );
  assertStringIncludes(parse5.serialize(doc.document), "<p>page</p>");
});
