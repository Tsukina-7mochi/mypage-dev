import type * as esbuild from 'esbuild';
import * as path from '@std/path';

import htmlTemplatePlugin from './plugins/htmlTemplatePlugin.ts';

export type BuildOptionsOptions = {
  srcPath: string;
  destPath: string;
};

export const buildOptions = (
  options: BuildOptionsOptions,
): esbuild.BuildOptions => ({
  entryPoints: [
    path.join(options.srcPath, 'index.html'),
  ],
  outdir: options.destPath,
  plugins: [htmlTemplatePlugin({
    root: path.join(options.srcPath, 'contents'),
  })],
});
