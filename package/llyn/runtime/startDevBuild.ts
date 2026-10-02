import * as path from "@std/path";

import { loadConfig, runBuild } from "../core/index.ts";
import { copyPublic } from "../build/main.ts";
import { DevContext } from "./devContext.ts";

export async function startDevBuild(): Promise<DevContext | undefined> {
  const config = await loadConfig();
  const islands = await runBuild(config, {
    dev: true,
    liveReload: true,
    worker: false,
  });
  await copyPublic(config);
  console.log("dev build finished");
  return {
    islands: new Map(islands.map((island) => [island.id, island.url])),
    staticDir: path.fromFileUrl(new URL("static/", config.dist)),
  };
}
