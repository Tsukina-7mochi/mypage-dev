import * as esbuild from "esbuild";
import { Island } from "../island.ts";
import { renderServerRenderer } from "./serverRenderer.ts";

const namespace = "worker-fetch-island-plugin";

export type PluginOptions = {
  islands: Island[];
  // Live reload is served only when a boot id is given.
  bootId?: string;
};

export function llynRuntimePlugin(options: PluginOptions): esbuild.Plugin {
  return {
    name: namespace,
    setup: (build) => {
      let serverRenderer = "";
      build.onStart(async () => {
        serverRenderer = await renderServerRenderer(
          options.islands,
          options.bootId,
        );
      });

      build.onResolve({ filter: /^llyn\/runtime$/ }, (args) => {
        return { path: args.path, namespace };
      });

      build.onLoad({ filter: /.*/, namespace }, () => {
        return { contents: serverRenderer, loader: "ts" };
      });
    },
  };
}
