import * as llyn from "llyn";

await llyn.build("./src/", "./dist", ["./src/index.html"], "./src/worker.ts");
