import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import * as parse5 from "parse5";
import * as path from "@std/path";

import { Context } from "../../context.ts";
import { htmlNodeProcessor } from "../html/processor.ts";
import { endPoint } from "../html/liveReload.ts";
import { loadMarkdown } from "./load.ts";

const template = (marker: string) =>
  `<html><head></head><body><main data-template="${marker}"></main></body></html>`;

let temporaryDirectory: string;
let routes: string;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  routes = path.join(temporaryDirectory, "routes");
  await Deno.mkdir(path.join(routes, "layouts"), { recursive: true });
  await Deno.writeTextFile(
    path.join(routes, "template.html"),
    template("default"),
  );
  await Deno.writeTextFile(
    path.join(routes, "layouts", "custom.html"),
    template("custom"),
  );
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

function context(liveReload = false): Context {
  return {
    dev: true,
    liveReload,
    root: path.toFileUrl(routes + "/"),
    staticDist: path.toFileUrl(
      path.join(temporaryDirectory, "dist", "static") + "/",
    ),
  };
}

async function writePost(frontmatter: string[] = []): Promise<URL> {
  const file = path.join(routes, "post.md");
  await Deno.writeTextFile(
    file,
    [
      "---",
      "title: Post",
      "createdAt: 2026-01-01",
      "updatedAt: 2026-01-01",
      ...frontmatter,
      "---",
      "body",
    ].join("\n"),
  );
  return path.toFileUrl(file);
}

async function loadPost(frontmatter?: string[]): Promise<string> {
  const doc = await loadMarkdown(await writePost(frontmatter), context());
  return parse5.serialize(doc.document);
}

Deno.test("markdown uses template.html by default", async () => {
  assertStringIncludes(await loadPost(), 'data-template="default"');
});

Deno.test("markdown uses the template given in frontmatter", async () => {
  assertStringIncludes(
    await loadPost(["template: ./layouts/custom.html"]),
    'data-template="custom"',
  );
});

Deno.test("markdown body is inserted without a nested document", async () => {
  const html = await loadPost();
  assertEquals(html.match(/<html/g)?.length, 1);
  assertStringIncludes(html, '<main data-template="default"><p>body</p>');
});

Deno.test("markdown frontmatter is inserted into the head", async () => {
  const html = await loadPost(["og:", "  description: desc"]);
  assertStringIncludes(html, "<title>Post</title>");
  assertStringIncludes(html, '<meta property="og:title" content="Post">');
  assertStringIncludes(html, '<meta name="twitter:title" content="Post">');
  assertStringIncludes(
    html,
    '<meta property="og:description" content="desc"></head>',
  );
});

Deno.test("markdown is output as html under the static dist", async () => {
  const doc = await loadMarkdown(await writePost(), context());
  assertEquals(
    doc.outPath,
    path.join(temporaryDirectory, "dist", "static", "post.html"),
  );
});

Deno.test("markdown without frontmatter is rejected", async () => {
  const file = path.join(routes, "post.md");
  await Deno.writeTextFile(file, "body");

  await assertRejects(
    () => loadMarkdown(path.toFileUrl(file), context()),
    Error,
    "Frontmatter is required",
  );
});

Deno.test("markdown output has a single live reload script", async () => {
  const ctx = context(true);
  const doc = await loadMarkdown(await writePost(), ctx);
  await htmlNodeProcessor(doc.url, doc.document, ctx);
  const html = parse5.serialize(doc.document);
  assertEquals(html.split(endPoint).length - 1, 1);
});

Deno.test("markdown page with islands in body and template is processed once", async () => {
  await Deno.mkdir(path.join(routes, "blog"), { recursive: true });
  await Deno.writeTextFile(
    path.join(routes, "counter.tsx"),
    "export default function Counter() { return <span />; }",
  );
  await Deno.writeTextFile(
    path.join(routes, "layouts", "template.html"),
    '<html><head><link rel="stylesheet" href="./layout.css"></head><body><script type="application/client-island" src="../counter.tsx"></script><main></main></body></html>',
  );
  const file = path.join(routes, "blog", "post.md");
  await Deno.writeTextFile(
    file,
    [
      "---",
      "title: Post",
      "createdAt: 2026-01-01",
      "updatedAt: 2026-01-01",
      "template: ../layouts/template.html",
      "---",
      '<script type="application/client-island" src="../counter.tsx"></script>',
    ].join("\n"),
  );

  const ctx = context();
  const doc = await loadMarkdown(path.toFileUrl(file), ctx);
  const output = await htmlNodeProcessor(doc.url, doc.document, ctx);
  const html = parse5.serialize(doc.document);

  assertEquals(output.virtualFiles.length, 1);
  assertEquals(
    html.match(/<script type="module" src="[^"]*"/g),
    ['<script type="module" src="post-bootstrap.js"'],
  );
  const domIds = output.islands.map((instance) => instance.domId);
  assertEquals(new Set(domIds).size, 2);
  assertEquals(
    output.islands.map((instance) => instance.island.specifier),
    ["counter.tsx", "counter.tsx"],
  );
  assertStringIncludes(html, 'href="/layouts/layout.css"');
});
