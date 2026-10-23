import { loadConfig, runBuild } from "llyn/core";

const watchPaths = ["routes/", "src/", "llyn.config.ts"];
const debounceMs = 100;

function spawnDeno(args: string[]): Deno.ChildProcess {
  return new Deno.Command(Deno.execPath(), { args }).spawn();
}

// Builds in a subprocess so that island modules are imported fresh each time.
async function buildDev(): Promise<boolean> {
  const { success } = await spawnDeno([
    "run",
    "-RWE",
    "--allow-run",
    "--allow-sys=homedir",
    "./package/llyn/core/main.ts",
    "--dev",
    "--live-reload",
  ]).status;
  return success;
}

function serve(): Deno.ChildProcess {
  return spawnDeno([
    "serve",
    "--port=8080",
    "-RN",
    "--env-file=.dev.vars",
    "./dist/worker.js",
  ]);
}

async function stop(process: Deno.ChildProcess | undefined) {
  if (process === undefined) return;
  try {
    process.kill();
  } catch {
    // Already exited.
  }
  await process.status;
}

async function dev() {
  let server: Deno.ChildProcess | undefined;
  let building = false;
  let pending = false;

  const rebuild = async () => {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    do {
      pending = false;
      if (await buildDev()) {
        await stop(server);
        server = serve();
      } else {
        console.error("build failed; waiting for changes");
      }
    } while (pending);
    building = false;
  };

  Deno.addSignalListener("SIGINT", async () => {
    await stop(server);
    Deno.exit();
  });

  await rebuild();

  let timer: ReturnType<typeof setTimeout> | undefined;
  for await (const _event of Deno.watchFs(watchPaths)) {
    clearTimeout(timer);
    timer = setTimeout(rebuild, debounceMs);
  }
}

if (Deno.args.includes("--dev")) {
  await dev();
} else {
  await runBuild(await loadConfig(), { dev: false, liveReload: false });
  console.log("build finished");
}
