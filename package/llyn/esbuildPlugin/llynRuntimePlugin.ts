import * as esbuild from "esbuild";
import * as island from "../island/index.ts";

const namespace = "worker-fetch-island-plugin";

export type Island = {
  id: string;
  path: string;
  props: Record<string, string>;
};

export type PluginOptions = {
  islands: Island[];
};

export function llynRuntimePlugin(options: PluginOptions): esbuild.Plugin {
  return {
    name: namespace,
    setup: (build) => {
      let serverRenderer = "";
      build.onStart(async () => {
        serverRenderer = await island.renderServerRenderer(options.islands);
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
