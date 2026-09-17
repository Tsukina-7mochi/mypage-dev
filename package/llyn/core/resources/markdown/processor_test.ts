import { exists } from "@std/fs";
import * as path from "@std/path";

import { createContext } from "../../processor.ts";
import { renderMarkdownDocument } from "./processor.ts";

function assertIncludes(actual: string, expected: string): void {
  if (!actual.includes(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(actual)} to include ${expected}`,
    );
  }
}

Deno.test("renders a Markdown document without writing it to dist", async () => {
  const temporaryDirectory = await Deno.makeTempDir();
  try {
    const rootPath = path.join(temporaryDirectory, "routes");
    const blogPath = path.join(rootPath, "blog");
    const distPath = path.join(temporaryDirectory, "dist");
    const staticDistPath = path.join(distPath, "static");
    const documentPath = path.join(blogPath, "post.md");
    const templatePath = path.join(blogPath, "template.html");
    await Deno.mkdir(blogPath, { recursive: true });
    await Promise.all([
      Deno.writeTextFile(
        documentPath,
        [
          "---",
          "title: Example",
          "createdAt: 2026-01-01",
          "updatedAt: 2026-01-02",
          "---",
          "# Hello",
        ].join("\n"),
      ),
      Deno.writeTextFile(
        templatePath,
        "<!doctype html><html><head></head><body><main></main></body></html>",
      ),
    ]);

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

    const content = await renderMarkdownDocument(
      path.toFileUrl(documentPath),
      path.toFileUrl(templatePath),
      ctx,
    );

    assertIncludes(content, "<title>Example</title>");
    assertIncludes(content, "<h1>Hello</h1>");
    assertIncludes(content, '<script src="post-bootstrap.js"></script>');
    if (await exists(path.join(staticDistPath, "blog", "post.html"))) {
      throw new Error("renderMarkdownDocument unexpectedly wrote to dist");
    }
  } finally {
    await Deno.remove(temporaryDirectory, { recursive: true });
  }
});
