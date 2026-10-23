import { BuildOptions, runBuild } from "./runBuild.ts";
import { loadConfig, ResolvedLlynConfig } from "./config.ts";

const flags = ["--dev", "--live-reload"];

export async function build(
  config?: ResolvedLlynConfig,
  options: BuildOptions = { dev: false, liveReload: false },
): Promise<void> {
  config ??= await loadConfig();
  await runBuild(config, options);
  console.log("build finished");
}

export async function main(args: string[]): Promise<void> {
  const unknown = args.filter((arg) => !flags.includes(arg));
  if (unknown.length > 0) {
    throw new Error(`Unknown arguments: ${unknown.join(" ")}`);
  }
  await build(undefined, {
    dev: args.includes("--dev"),
    liveReload: args.includes("--live-reload"),
  });
}

if (import.meta.main) {
  await main(Deno.args);
}
