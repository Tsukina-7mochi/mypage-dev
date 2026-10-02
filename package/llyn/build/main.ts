import * as fs from "@std/fs";
import * as path from "@std/path";

import { loadConfig, runBuild } from "../core/index.ts";
import { ResolvedLlynConfig } from "../core/config.ts";

export async function copyPublic(config: ResolvedLlynConfig): Promise<void> {
  if (!config.public) return;

  const staticDist = new URL("static/", config.dist);
  const publicPath = path.fromFileUrl(config.public);
  const destination = path.join(
    path.fromFileUrl(staticDist),
    path.basename(path.resolve(publicPath)),
  );
  await fs.ensureDir(destination);
  await fs.copy(publicPath, destination, { overwrite: true });
}

export async function build(config?: ResolvedLlynConfig): Promise<void> {
  config ??= await loadConfig();
  await runBuild(config, { dev: false, liveReload: false, worker: true });
  await copyPublic(config);
  console.log("build finished");
}

export async function main(args: string[]): Promise<void> {
  if (args.length === 0) {
    await build();
    return;
  }
  throw new Error(`Unknown arguments: ${args.join(" ")}`);
}

if (import.meta.main) {
  await main(Deno.args);
}
