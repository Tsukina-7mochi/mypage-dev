import * as esbuild from "esbuild";

const namespace = "worker-fetch-island-plugin";

export type PluginOptions = {
  // Generated source of `llyn/runtime`.
  contents: string;
};

export function llynRuntimePlugin(options: PluginOptions): esbuild.Plugin {
  return {
    name: namespace,
    setup: (build) => {
      build.onResolve({ filter: /^llyn\/runtime$/ }, (args) => {
        return { path: args.path, namespace };
      });

      build.onLoad({ filter: /.*/, namespace }, () => {
        return { contents: options.contents, loader: "ts" };
      });
    },
  };
}
