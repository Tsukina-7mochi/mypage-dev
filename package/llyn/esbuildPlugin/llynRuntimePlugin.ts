import * as esbuild from "esbuild";
import { Island } from "../types.ts";
import { renderServerRenderer } from "../island/serverRenderer.ts";

const namespace = "worker-fetch-island-plugin";

export type PluginOptions = {
  islands: Island[];
};

export function llynRuntimePlugin(options: PluginOptions): esbuild.Plugin {
  return {
    name: namespace,
    setup: (build) => {
      let serverRenderer = "";
      build.onStart(async () => {
        serverRenderer = await renderServerRenderer(options.islands);
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
