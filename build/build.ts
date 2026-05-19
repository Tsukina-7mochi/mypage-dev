import * as llyn from "llyn";

await llyn.build({
  root: "./src/",
  dist: "./dist",
  entries: {
    documents: [
      "./src/index.html",
      {
        type: "markdown",
        path: "./src/blog/test.md",
        template: "./src/blog/template.html",
      },
    ],
    worker: "./src/worker.ts",
  },
});
