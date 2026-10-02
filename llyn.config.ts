import { defineConfig } from "llyn/core";

export default defineConfig({
  root: "./routes",
  dist: "./dist",
  documents: ["**/*.html", "**/*.md"],
  documentsExclude: ["**/template.html"],
  public: "./routes/public",
  worker: "./src/main.ts",
});
