import * as esbuild from 'esbuild';

export const externalFontPlugin: esbuild.Plugin = {
  name: 'external-font-plugin',
  setup(build) {
    build.onResolve({ filter: /\.(ttf|otf|woff2?)$/ }, () => {
      return {
        external: true,
      };
    });
  },
};
