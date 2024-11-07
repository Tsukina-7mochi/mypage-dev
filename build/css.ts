import type * as esbuild from 'esbuild';
import * as path from '@std/path';
import { sassPlugin } from 'jsr:@tsukina-7mochi/esbuild-plugin-sass';

export type BuildOptionsOptions = {
  srcPath: string;
  destPath: string;
  dev: boolean;
};

export const buildOptions = (
  options: BuildOptionsOptions,
): esbuild.BuildOptions => ({
  entryPoints: [
    path.join(options.srcPath, 'style.scss'),
  ],
  outdir: options.destPath,
  bundle: true,
  sourcemap: options.dev ? 'inline' : 'linked',
  minify: !options.dev,
  plugins: [sassPlugin()],
});
