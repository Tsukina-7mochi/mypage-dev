import * as esbuild from "esbuild";
import * as path from "@std/path";

const namespace = "virtual-file-plugin";

const loaderRules = [
  { test: /\.(c|m)?js$/, loader: "js" },
  { test: /\.jsx$/, loader: "jsx" },
  { test: /\.(c|m)?ts$/, loader: "ts" },
  { test: /\.tsx$/, loader: "tsx" },
  { test: /\.json$/, loader: "json" },
  { test: /\.css$/, loader: "css" },
  { test: /\.txt$/, loader: "text" },
] as const;

export type PluginOptions = {
  files: { [key: string]: string };
};

export function virtualFilePlugin(options: PluginOptions): esbuild.Plugin {
  return {
    name: namespace,
    setup: (build) => {
      for (const name in options.files) {
        const filter = path.globToRegExp(name);
        build.onResolve({ filter }, () => {
          return { path: `virtual:${name}`, namespace };
        });
      }

      build.onLoad({ filter: /^virtual:/, namespace }, (args) => {
        let loader = undefined;
        for (const rule of loaderRules) {
          if (rule.test.test(args.path)) {
            loader = rule.loader;
          }
        }

        const name = args.path.slice(8);
        return { contents: options.files[name], loader };
      });
    },
  };
}
