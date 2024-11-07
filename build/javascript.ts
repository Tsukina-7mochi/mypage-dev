import type * as esbuild from 'esbuild';
import * as path from '@std/path';
import { denoPlugins } from 'esbuild-deno-loader';

import liveReloadPlugin from './plugins/liveReloadPlugin.ts';

export type BuildOptionsOptions = {
  srcPath: string;
  destPath: string;
  dev: boolean;
};

export const buildOptions = (
  options: BuildOptionsOptions,
): esbuild.BuildOptions => ({
  entryPoints: [
    path.join(options.srcPath, 'main.ts'),
  ],
  outdir: options.destPath,
  bundle: true,
  sourcemap: options.dev ? 'inline' : 'linked',
  minify: !options.dev,
  platform: 'browser',
  plugins: [
    liveReloadPlugin({ enabled: options.dev }),
    ...denoPlugins(),
  ],
});
