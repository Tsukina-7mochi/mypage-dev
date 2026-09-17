import { assertEquals } from "@std/assert";
import * as path from "@std/path";

import { collectDocuments, collectIslandUrls } from "./collect.ts";
import { ResolvedLlynConfig } from "./config.ts";

let temporaryDirectory: string;
let routes: string;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  routes = path.join(temporaryDirectory, "routes");
  await Deno.mkdir(path.join(routes, "blog"), { recursive: true });
  await Deno.mkdir(path.join(routes, "components"), { recursive: true });
  await Promise.all([
    Deno.writeTextFile(path.join(routes, "index.html"), ""),
    Deno.writeTextFile(path.join(routes, "blog", "post.md"), ""),
    Deno.writeTextFile(path.join(routes, "blog", "template.html"), ""),
    Deno.writeTextFile(path.join(routes, "feed.tsx"), ""),
    Deno.writeTextFile(path.join(routes, "components", "card.tsx"), ""),
  ]);
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

Deno.test("collects documents matching the configured globs", async () => {
  const config: ResolvedLlynConfig = {
    root: path.toFileUrl(routes),
    dist: path.toFileUrl(path.join(temporaryDirectory, "dist")),
    documents: ["**/*.html", "**/*.md", "blog/*.md"],
    documentsExclude: ["**/template.html"],
    islands: ["**/*.tsx"],
    islandsExclude: ["components/**/*.tsx"],
    public: path.toFileUrl(path.join(routes, "public")),
    worker: path.toFileUrl(path.join(temporaryDirectory, "src", "main.ts")),
  };

  const documents = await collectDocuments(config);
  assertEquals(
    documents.map((entry) => ({
      type: entry.type,
      path: path.relative(routes, path.fromFileUrl(entry.path)),
      template: entry.type === "markdown"
        ? path.relative(routes, path.fromFileUrl(entry.template))
        : undefined,
    })).toSorted((a, b) => a.path.localeCompare(b.path)),
    [
      {
        type: "markdown",
        path: "blog/post.md",
        template: "blog/template.html",
      },
      {
        type: "markdown",
        path: "blog/post.md",
        template: "blog/template.html",
      },
      { type: "html", path: "index.html", template: undefined },
    ],
  );
});

Deno.test("collects islands matching the configured globs", async () => {
  const config: ResolvedLlynConfig = {
    root: path.toFileUrl(routes),
    dist: path.toFileUrl(path.join(temporaryDirectory, "dist")),
    documents: [],
    documentsExclude: [],
    islands: ["**/*.tsx"],
    islandsExclude: ["components/**/*.tsx"],
    worker: path.toFileUrl(path.join(temporaryDirectory, "src", "main.ts")),
  };
  const islandUrls = await collectIslandUrls(config);
  assertEquals(
    islandUrls.map((url) => path.relative(routes, path.fromFileUrl(url))),
    ["feed.tsx"],
  );
});
