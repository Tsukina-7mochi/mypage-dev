import { assertEquals } from "@std/assert";
import * as path from "@std/path";

import { ResolvedLlynConfig } from "../core/config.ts";
import { copyPublic } from "./main.ts";

let temporaryDirectory: string;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

Deno.test("copyPublic copies the configured directory under static", async () => {
  const publicPath = path.join(temporaryDirectory, "public");
  await Deno.mkdir(path.join(publicPath, "icons"), { recursive: true });
  await Deno.writeTextFile(path.join(publicPath, "icons", "logo.svg"), "logo");
  const config: ResolvedLlynConfig = {
    root: path.toFileUrl(path.join(temporaryDirectory, "routes")),
    dist: new URL(
      path.toFileUrl(path.join(temporaryDirectory, "dist")).href + "/",
    ),
    documents: [],
    documentsExclude: [],
    islands: [],
    islandsExclude: [],
    public: path.toFileUrl(publicPath),
    worker: path.toFileUrl(path.join(temporaryDirectory, "src", "main.ts")),
  };

  await copyPublic(config);

  assertEquals(
    await Deno.readTextFile(
      path.join(
        temporaryDirectory,
        "dist",
        "static",
        "public",
        "icons",
        "logo.svg",
      ),
    ),
    "logo",
  );
});
