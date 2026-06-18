import * as llyn from "llyn";

const dev = Deno.args.includes("--dev");

const options: llyn.BuildOptions = {
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
    worker: "./src/worker/main.ts",
  },
};

if (dev) {
  await llyn.startDevServer(options, { port: 8080 });
} else {
  await llyn.build(options);
}
