import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import * as path from "@std/path";

import { markdownProcessor } from "./processor.ts";
import { endPoint } from "../html/liveReload.ts";

const template = (marker: string) =>
  `<html><head></head><body><main data-template="${marker}"></main></body></html>`;

async function buildPost(
  frontmatterTemplate?: string,
  dev = true,
  liveReload = false,
): Promise<string> {
  const directory = await Deno.makeTempDir();
  try {
    const routes = path.join(directory, "routes");
    await Deno.mkdir(path.join(routes, "layouts"), { recursive: true });
    await Deno.writeTextFile(
      path.join(routes, "template.html"),
      template("default"),
    );
    await Deno.writeTextFile(
      path.join(routes, "layouts", "custom.html"),
      template("custom"),
    );
    await Deno.writeTextFile(
      path.join(routes, "post.md"),
      [
        "---",
        "title: Post",
        "createdAt: 2026-01-01",
        "updatedAt: 2026-01-01",
        ...(frontmatterTemplate ? [`template: ${frontmatterTemplate}`] : []),
        "---",
        "body",
      ].join("\n"),
    );

    const root = path.toFileUrl(routes + "/");
    await markdownProcessor(new URL("post.md", root), {
      dev,
      liveReload,
      root,
      staticDist: path.toFileUrl(path.join(directory, "dist", "static") + "/"),
    });
    return await Deno.readTextFile(
      path.join(directory, "dist", "static", "post.html"),
    );
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
}

Deno.test("markdown uses template.html by default", async () => {
  assertStringIncludes(await buildPost(), 'data-template="default"');
});

Deno.test("markdown uses the template given in frontmatter", async () => {
  assertStringIncludes(
    await buildPost("./layouts/custom.html"),
    'data-template="custom"',
  );
});

Deno.test("markdown body is inserted without a nested document", async () => {
  const html = await buildPost();
  assertEquals(html.match(/<html/g)?.length, 1);
  assertStringIncludes(html, '<main data-template="default"><p>body</p>');
});

Deno.test("markdown output is minified in production", async () => {
  const html = await buildPost(undefined, false);
  assertEquals(html.includes("\n"), false);
});

Deno.test("markdown without frontmatter is rejected", async () => {
  const directory = await Deno.makeTempDir();
  try {
    const file = path.join(directory, "post.md");
    await Deno.writeTextFile(file, "body");

    await assertRejects(
      () =>
        markdownProcessor(path.toFileUrl(file), {
          dev: true,
          liveReload: false,
          root: path.toFileUrl(directory + "/"),
          staticDist: path.toFileUrl(path.join(directory, "dist") + "/"),
        }),
      Error,
      "Frontmatter is required",
    );
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test("markdown output has a single live reload script", async () => {
  const html = await buildPost(undefined, true, true);
  assertEquals(html.split(endPoint).length - 1, 1);
});
