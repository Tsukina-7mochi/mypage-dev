import * as llyn from "llyn";
import * as fs from "@std/fs";
import * as path from "@std/path";

const dev = Deno.args.includes("--dev");
const routeDir = "./routes";

const documents = [];

for await (const file of fs.expandGlob(`${routeDir}/**/*.html`)) {
  if (file.name === "template.html") {
    continue;
  }

  documents.push(
    {
      type: "html",
      path: file.path,
    } as const,
  );
}

for await (const file of fs.expandGlob(`${routeDir}/**/*.md`)) {
  documents.push(
    {
      type: "markdown",
      path: file.path,
      template: path.join(path.dirname(file.path), "template.html"),
    } as const,
  );
}

const options: llyn.BuildOptions = {
  dev: true,
  root: "./routes/",
  dist: "./dist",
  entries: {
    documents,
    worker: "./src/main.ts",
  },
};

if (dev) {
  await llyn.startDevServer(options, { port: 8080 });
} else {
  await llyn.build(options);
}
