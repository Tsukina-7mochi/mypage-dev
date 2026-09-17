import * as fs from "@std/fs";
import * as path from "@std/path";

import { loadConfig, runBuild, startBuildServer } from "../core/index.ts";
import { ResolvedLlynConfig } from "../core/config.ts";
import { ServerOptions } from "../core/types.ts";

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

export async function runConfiguredBuild(
  config: ResolvedLlynConfig,
  dev: boolean,
  liveReload: boolean,
): Promise<void> {
  await runBuild(config, {
    dev,
    liveReload,
  });
  await copyPublic(config);
}

export async function build(config?: ResolvedLlynConfig): Promise<void> {
  config ??= await loadConfig();
  await runConfiguredBuild(config, false, false);
  console.log("build finished");
}

export async function startDevServer(
  config?: ResolvedLlynConfig,
  serverOptions: ServerOptions = { port: 8080 },
): Promise<void> {
  config ??= await loadConfig();
  await startBuildServer(
    config.root,
    config.dist,
    async () => {
      await runConfiguredBuild(config, true, true);
    },
    serverOptions,
  );
}

export async function main(args: string[]): Promise<void> {
  if (args.length === 0) {
    await build();
    return;
  }
  if (args.length === 1 && args[0] === "--dev") {
    await startDevServer();
    return;
  }
  throw new Error(`Unknown arguments: ${args.join(" ")}`);
}

if (import.meta.main) {
  await main(Deno.args);
}
