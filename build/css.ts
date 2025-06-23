import type * as esbuild from 'esbuild';
import * as path from '@std/path';

export type BuildOptionsOptions = {
  srcPath: string;
  destPath: string;
  dev: boolean;
};

export const buildOptions = (
  options: BuildOptionsOptions,
): esbuild.BuildOptions => ({
  entryPoints: [
    { in: path.join(options.srcPath, 'global.css'), out: 'index' },
  ],
  outdir: options.destPath,
  bundle: true,
  sourcemap: options.dev ? 'inline' : 'linked',
  minify: !options.dev,
});
