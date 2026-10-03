import * as path from "@std/path";

import { getStaticDist, loadConfig, runBuild } from "../core/index.ts";
import { DevContext } from "./devContext.ts";

export async function startDevBuild(): Promise<DevContext | undefined> {
  const config = await loadConfig();
  const islands = await runBuild(config, {
    dev: true,
    liveReload: true,
    worker: false,
  });
  console.log("dev build finished");
  return {
    islands: new Map(islands.map((island) => [island.id, island.url])),
    staticDir: path.fromFileUrl(getStaticDist(config)),
  };
}
