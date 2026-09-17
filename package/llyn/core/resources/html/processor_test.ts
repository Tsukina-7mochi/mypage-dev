import * as parse5 from "parse5";
import * as path from "@std/path";
import { exists } from "@std/fs";

import { createIsland, generateIslandId } from "../../island.ts";
import { createContext } from "../../processor.ts";
import { htmlNodeProcessor, renderHtmlDocument } from "./processor.ts";

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
    resolveIsland(url) {
      return createIsland(new URL("file:///site/routes/"), url);
    },
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
  assertIncludes(bootstrap, '{"label":"first","_prerender":false}');
  assertIncludes(bootstrap, '{"label":"second","_prerender":false}');
});

Deno.test("renders an HTML document without writing it to dist", async () => {
  const temporaryDirectory = await Deno.makeTempDir();
  try {
    const rootPath = path.join(temporaryDirectory, "routes");
    const distPath = path.join(temporaryDirectory, "dist");
    const staticDistPath = path.join(distPath, "static");
    const documentPath = path.join(rootPath, "index.html");
    await Deno.mkdir(rootPath);
    await Deno.writeTextFile(documentPath, "<main>hello</main>");

    const ctx = createContext({
      dev: true,
      liveReload: false,
      root: path.toFileUrl(rootPath + path.SEPARATOR),
      dist: path.toFileUrl(distPath + path.SEPARATOR),
      staticDist: path.toFileUrl(staticDistPath + path.SEPARATOR),
      resolveIsland() {
        throw new Error("Unexpected island");
      },
      registerSourceFile() {},
      registerVirtualFile() {},
      registerIsland() {},
      registerServerIsland() {},
    });

    const content = await renderHtmlDocument(
      path.toFileUrl(documentPath),
      ctx,
    );

    assertIncludes(content, "<main>hello</main>");
    assertIncludes(content, '<script src="index-bootstrap.js"></script>');
    if (await exists(path.join(staticDistPath, "index.html"))) {
      throw new Error("renderHtmlDocument unexpectedly wrote to dist");
    }
  } finally {
    await Deno.remove(temporaryDirectory, { recursive: true });
  }
});
