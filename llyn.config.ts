import { defineConfig } from "llyn";

export default defineConfig({
  root: "./routes",
  dist: "./dist",
  documents: ["**/*.html", "**/*.md"],
  documentsExclude: ["**/template.html"],
  islands: ["**/*.tsx"],
  public: "./routes/public",
  worker: "./src/main.ts",
});
