import * as llyn from "llyn";

await llyn.build({
  root: "./src/",
  outdir: "./dist",
  entries: {
    documents: ["./src/index.html"],
    worker: "./src/worker.ts",
  },
});
