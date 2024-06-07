import * as esbuild from 'esbuild';

type LiveReloadPluginOptions = {
  enabled: boolean;
};

const namespace = 'live-reload-plugin';

const liveReloadPlugin = (
  options?: LiveReloadPluginOptions,
): esbuild.Plugin => ({
  name: 'live-reload-plugin',
  setup(build) {
    build.onResolve({ filter: /^live-reload-plugin$/ }, (args) => {
      return {
        path: args.path,
        namespace,
      };
    });

    build.onLoad({ filter: /./, namespace }, () => {
      if (options?.enabled === false) {
        return { contents: '', loader: 'empty' };
      }

      return {
        contents:
          `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
        loader: 'js',
      };
    });
  },
});

export default liveReloadPlugin;
