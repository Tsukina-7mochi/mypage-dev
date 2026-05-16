import * as llyn from "llyn";

await llyn.build({
  root: "./src/",
  dist: "./dist",
  entries: {
    documents: ["./src/index.html", "./src/blog/test.md"],
    worker: "./src/worker.ts",
  },
  markdownTemplate: "./src/blog/template.html",
});
