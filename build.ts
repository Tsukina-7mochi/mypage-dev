import * as llyn from "llyn";

const dev = Deno.args.includes("--dev");

if (dev) {
  await llyn.startDevServer({
    dev: true,
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
  }, {
    port: 8080,
  });
} else {
  await llyn.build({
    dev: false,
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
}
