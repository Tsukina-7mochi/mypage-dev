import type * as esbuild from 'esbuild';
import * as path from '@std/path';

export type BuildOptionsOptions = {
  srcPath: string;
  destPath: string;
};

export const buildOptions = async (
  options: BuildOptionsOptions,
): Promise<esbuild.BuildOptions> => {
  const imageEntries = await Array.fromAsync(
    Deno.readDir(path.join(options.srcPath, 'imgs')),
  );
  const images = imageEntries
    .filter((entry) => entry.isFile)
    .map((entry) => path.join(options.srcPath, 'imgs', entry.name));

  const fontEntries = await Array.fromAsync(
    Deno.readDir(path.join(options.srcPath, 'fonts')),
  );
  const fonts = fontEntries
    .filter((entry) => entry.isFile)
    .map((entry) => path.join(options.srcPath, 'fonts', entry.name));

  return ({
    entryPoints: images,
    outdir: path.join(options.destPath, 'imgs'),
    loader: { '.svg': 'copy' },
  });
};
