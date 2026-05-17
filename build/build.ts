import * as llyn from "llyn";

await llyn.build({
  dev: false,
  root: "./src/",
  dist: "./dist",
  entries: {
    documents: ["./src/index.html", "./src/blog/test.md"],
    worker: "./src/worker.ts",
  },
  markdownTemplate: "./src/blog/template.html",
});
