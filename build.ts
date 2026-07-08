import * as llyn from "llyn";

const dev = Deno.args.includes("--dev");

const options: llyn.BuildOptions = {
  dev: true,
  root: "./routes/",
  dist: "./dist",
  entries: {
    documents: [
      "./routes/index.html",
      {
        type: "markdown",
        path: "./routes/blog/test.md",
        template: "./routes/blog/template.html",
      },
      {
        type: "markdown",
        path: "./routes/blog/aseprite-scripts.md",
        template: "./routes/blog/template.html",
      },
      {
        type: "markdown",
        path: "./routes/blog/aseprite-type-definition.md",
        template: "./routes/blog/template.html",
      },
    ],
    worker: "./src/main.ts",
  },
};

if (dev) {
  await llyn.startDevServer(options, { port: 8080 });
} else {
  await llyn.build(options);
}
