import * as core from "./core/index.ts";
import * as llyn from "./index.ts";

Deno.test("exports the legacy build API from the package entry point", () => {
  if (llyn.build !== core.build) {
    throw new Error("build is not re-exported from the package entry point");
  }
  if (llyn.startDevServer !== core.startDevServer) {
    throw new Error(
      "startDevServer is not re-exported from the package entry point",
    );
  }
});
