import { loadConfig, runBuild } from "../core/index.ts";
import { ResolvedLlynConfig } from "../core/config.ts";

export async function build(config?: ResolvedLlynConfig): Promise<void> {
  config ??= await loadConfig();
  await runBuild(config, { dev: false, liveReload: false, worker: true });
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
