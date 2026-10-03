import * as esbuild from "esbuild";

export function dataUrlPlugin(): esbuild.Plugin {
  return {
    name: "data-url",
    setup(build) {
      build.onResolve({ filter: /^data:/ }, (args) => {
        return { path: args.path, external: true };
      });
    },
  };
}
