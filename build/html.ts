import type * as esbuild from 'esbuild';
import * as path from '@std/path';
import { markdownPlugin } from './plugins/markdownPlugin.ts';

export type BuildOptionsOptions = {
  srcPath: string;
  destPath: string;
};

export const buildOptions = (
  options: BuildOptionsOptions,
): esbuild.BuildOptions => ({
  entryPoints: [
    path.join(options.srcPath, 'index.md'),
  ],
  outfile: path.join(options.destPath, 'index.html'),
  plugins: [markdownPlugin({
    templatePath: path.join(options.srcPath, 'template.html'),
  })],
});
