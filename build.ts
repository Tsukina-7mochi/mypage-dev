import { build } from "./build/index.ts";

await build("./src/", "./dist", [
  "./src/index.html",
]);
